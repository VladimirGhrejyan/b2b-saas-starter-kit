import {existsSync} from 'node:fs'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

import {Client} from 'pg'
import type {DataSource} from 'typeorm'

import {ConfigLoader} from '@b2b-saas-starter-kit/config'

import type {PostgresConfig} from '../kernel/config/postgres-config'
import {postgresConfigSchema} from '../kernel/config/postgres-config'
import {createDataSource} from '../kernel/data-source/create-data-source'
import type {CreateDataSourceOptions} from '../kernel/data-source/create-data-source.types'

import {applyComposeHostPort} from './apply-compose-host-port'

/**
 * Connects to compose Postgres on the `*_test` database. Creates that database if needed.
 */
export class PostgresTestContext {
  static readonly #defaultDatabaseUrl = 'postgres://app:change-me-local-only@127.0.0.1:5432/app'

  private constructor(
    readonly dataSource: DataSource,
    readonly config: PostgresConfig,
  ) {}

  static async connect(entities: NonNullable<CreateDataSourceOptions['entities']> = []): Promise<PostgresTestContext> {
    const config = PostgresTestContext.#loadTestConfig()

    await PostgresTestContext.#ensureDatabase(config)

    const dataSource = createDataSource(config, {entities})

    try {
      await dataSource.initialize()
    } catch (error) {
      PostgresTestContext.#throwConnectionError(error)
    }

    return new PostgresTestContext(dataSource, config)
  }

  async destroy(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy()
    }
  }

  static #loadTestConfig(): PostgresConfig {
    PostgresTestContext.#loadLocalEnv()

    const raw = applyComposeHostPort(
      process.env.DATABASE_URL ?? PostgresTestContext.#defaultDatabaseUrl,
      process.env.POSTGRES_PORT,
    )

    return ConfigLoader.load(postgresConfigSchema, {
      source: 'env',
      keys: ['DATABASE_URL'],
      env: {DATABASE_URL: PostgresTestContext.#toTestDatabaseUrl(raw)},
    })
  }

  static async #ensureDatabase(config: PostgresConfig): Promise<void> {
    const maintenanceUrl = PostgresTestContext.#toMaintenanceDatabaseUrl(config.DATABASE_URL)
    const databaseName = PostgresTestContext.#databaseName(config.DATABASE_URL)
    const client = new Client({connectionString: maintenanceUrl})

    try {
      await client.connect()
    } catch (error) {
      PostgresTestContext.#throwConnectionError(error)
    }

    try {
      const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName])

      if (existing.rows.length === 0) {
        PostgresTestContext.#assertSafeDatabaseName(databaseName)
        await client.query(`CREATE DATABASE ${databaseName}`)
      }
    } finally {
      await client.end()
    }
  }

  static #toTestDatabaseUrl(urlString: string): string {
    const url = new URL(urlString)
    const name = PostgresTestContext.#databaseName(urlString)

    if (name.endsWith('_test')) {
      return urlString
    }

    url.pathname = `/${name}_test`

    return url.toString()
  }

  static #toMaintenanceDatabaseUrl(testUrl: string): string {
    const url = new URL(testUrl)
    const name = PostgresTestContext.#databaseName(testUrl)
    const adminName = name.endsWith('_test') ? name.slice(0, -'_test'.length) : name

    url.pathname = `/${adminName}`

    return url.toString()
  }

  static #databaseName(urlString: string): string {
    return new URL(urlString).pathname.replace(/^\//, '').replace(/\/$/, '')
  }

  static #assertSafeDatabaseName(name: string): void {
    if (!/^[A-Za-z0-9_]+$/.test(name)) {
      throw new Error(`Unsafe test database name: ${name}`)
    }
  }

  static #loadLocalEnv(): void {
    const envPath = PostgresTestContext.#localEnvPath()

    if (!envPath) {
      return
    }

    process.loadEnvFile(envPath)
  }

  static #localEnvPath(): string | undefined {
    const fromModule = fileURLToPath(new URL('../../../../../infra/env/.env', import.meta.url))
    const candidates = [
      process.env.NX_WORKSPACE_ROOT ? join(process.env.NX_WORKSPACE_ROOT, 'infra/env/.env') : undefined,
      join(process.cwd(), 'infra/env/.env'),
      join(process.cwd(), '../../../infra/env/.env'),
      fromModule,
    ]

    return candidates.find((candidate) => candidate !== undefined && existsSync(candidate))
  }

  static #throwConnectionError(error: unknown): never {
    if (PostgresTestContext.#isUnreachable(error)) {
      throw new Error('Postgres is not reachable. Run `pnpm infra:up`.', {cause: error})
    }

    if (PostgresTestContext.#isWrongInstance(error)) {
      throw new Error(
        'Postgres rejected the kit credentials. A native Postgres is likely bound to this port instead of `pnpm infra:up`. Set POSTGRES_PORT in infra/env/.env to a free host port, keep DATABASE_URL in sync, then run `pnpm infra:up`.',
        {cause: error},
      )
    }

    throw error
  }

  static #isUnreachable(error: unknown): boolean {
    if (!(error instanceof Error) || !('code' in error)) {
      return false
    }

    return (
      typeof error.code === 'string' &&
      (error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'EAI_AGAIN' ||
        error.code === 'ETIMEDOUT')
    )
  }

  static #isWrongInstance(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false
    }

    const code = 'code' in error && typeof error.code === 'string' ? error.code : undefined
    const authCode = code === '28000' || code === '28P01'

    return authCode || /role ".*?" does not exist/i.test(error.message)
  }
}
