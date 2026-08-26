import {PostgresTestContext} from '@b2b-saas-starter-kit/postgres/testing'

import type {PostgresTestDatabase} from './prepare-postgres-test-database.types'

/**
 * Ensures the compose `*_test` database exists, applies migrations, and points `DATABASE_URL` at it.
 */
export async function preparePostgresTestDatabase(): Promise<PostgresTestDatabase> {
  const context = await PostgresTestContext.connect()

  process.env.DATABASE_URL = context.config.DATABASE_URL

  return {
    databaseUrl: context.config.DATABASE_URL,
    truncate: () => context.truncateFoundationTables(),
    destroy: () => context.destroy(),
  }
}
