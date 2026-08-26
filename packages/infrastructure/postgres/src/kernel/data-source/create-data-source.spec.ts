import {describe, expect, it} from 'vitest'

import {postgresConfigSchema} from '../config/postgres-config'

import {createDataSource} from './create-data-source'

describe('createDataSource', () => {
  it('builds an uninitialized postgres DataSource with pool and timeout defaults', () => {
    const dataSource = createDataSource(
      postgresConfigSchema.parse({
        DATABASE_URL: 'postgres://app:change-me-local-only@127.0.0.1:5432/app',
      }),
    )

    expect(dataSource.options.type).toBe('postgres')
    expect(dataSource.isInitialized).toBe(false)
    expect(dataSource.options.entities).not.toHaveLength(0)
    expect(dataSource.options.migrations).toHaveLength(3)
    expect(dataSource.options.poolSize).toBe(10)
    expect(dataSource.options.maxQueryExecutionTime).toBe(500)
    expect(dataSource.options.extra).toMatchObject({
      max: 10,
      connectionTimeoutMillis: 5000,
      statement_timeout: 15_000,
      lock_timeout: 5000,
      idle_in_transaction_session_timeout: 30_000,
      application_name: 'b2b-saas',
    })
  })
})
