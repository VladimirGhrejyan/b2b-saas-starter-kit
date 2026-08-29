import {existsSync} from 'node:fs'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

import type Redis from 'ioredis'

import {ConfigLoader} from '@b2b-saas-starter-kit/config'

import type {RedisConfig} from '../config/redis-config'
import {redisConfigSchema} from '../config/redis-config'
import {RedisClientManager} from '../connection/redis-client.manager'

import {applyComposeHostPort} from './apply-compose-host-port'

/**
 * Connects to compose Redis on logical DB 1 and FLUSHDB that database only.
 */
export class RedisTestContext {
  static readonly #defaultRedisUrl = 'redis://127.0.0.1:6379'

  private constructor(private readonly manager: RedisClientManager) {}

  get client(): Redis {
    return this.manager.get()
  }

  static async connect(): Promise<RedisTestContext> {
    const config = RedisTestContext.#loadTestConfig()
    const manager = new RedisClientManager(config)
    const context = new RedisTestContext(manager)

    try {
      await context.client.ping()
      await context.client.flushdb()
    } catch (error) {
      await manager.onModuleDestroy().catch(() => undefined)
      RedisTestContext.#throwConnectionError(error)
    }

    return context
  }

  async destroy(): Promise<void> {
    await this.manager.onModuleDestroy()
  }

  async flush(): Promise<void> {
    await this.client.flushdb()
  }

  static #loadTestConfig(): RedisConfig {
    RedisTestContext.#loadLocalEnv()

    const raw = applyComposeHostPort(process.env.REDIS_URL ?? RedisTestContext.#defaultRedisUrl, process.env.REDIS_PORT)

    return ConfigLoader.load(redisConfigSchema, {
      source: 'env',
      keys: ['REDIS_URL', 'REDIS_KEY_PREFIX'],
      env: {REDIS_URL: RedisTestContext.#toTestDatabaseUrl(raw)},
    })
  }

  static #toTestDatabaseUrl(urlString: string): string {
    const url = new URL(urlString)

    url.pathname = '/1'

    return url.toString()
  }

  static #loadLocalEnv(): void {
    const envPath = RedisTestContext.#localEnvPath()

    if (!envPath) {
      return
    }

    process.loadEnvFile(envPath)
  }

  static #localEnvPath(): string | undefined {
    const fromModule = fileURLToPath(new URL('../../../../../../infra/env/.env', import.meta.url))
    const candidates = [
      process.env.NX_WORKSPACE_ROOT ? join(process.env.NX_WORKSPACE_ROOT, 'infra/env/.env') : undefined,
      join(process.cwd(), 'infra/env/.env'),
      join(process.cwd(), '../../../infra/env/.env'),
      fromModule,
    ]

    return candidates.find((candidate) => candidate !== undefined && existsSync(candidate))
  }

  static #throwConnectionError(error: unknown): never {
    if (RedisTestContext.#isUnreachable(error)) {
      throw new Error('Redis is not reachable. Run `pnpm infra:up`.', {cause: error})
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
}
