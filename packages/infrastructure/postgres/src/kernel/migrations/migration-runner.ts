import type {DataSource} from 'typeorm'

import {loadPostgresConfigFromEnv} from '../config/load-postgres-config'
import type {PostgresConfig} from '../config/postgres-config'
import {createDataSource} from '../data-source/create-data-source'

/**
 * Runs or reverts the TypeORM migration set. Phase 7 ships an empty list (no-op).
 */
export class TypeormMigrationRunner {
  static async run(config?: PostgresConfig): Promise<void> {
    const dataSource = await TypeormMigrationRunner.#open(config)

    try {
      await dataSource.runMigrations()
    } finally {
      await dataSource.destroy()
    }
  }

  static async revert(config?: PostgresConfig): Promise<void> {
    const dataSource = await TypeormMigrationRunner.#open(config)

    try {
      await TypeormMigrationRunner.#revertLast(dataSource)
    } finally {
      await dataSource.destroy()
    }
  }

  static async #open(config?: PostgresConfig): Promise<DataSource> {
    const resolved = config ?? loadPostgresConfigFromEnv()
    const dataSource = createDataSource(resolved)

    await dataSource.initialize()

    return dataSource
  }

  static async #revertLast(dataSource: DataSource): Promise<void> {
    try {
      await dataSource.undoLastMigration()
    } catch (error) {
      if (TypeormMigrationRunner.#isNoMigrationsError(error)) {
        return
      }

      throw error
    }
  }

  static #isNoMigrationsError(error: unknown): boolean {
    return error instanceof Error && /no (executed )?migrations/i.test(error.message)
  }
}
