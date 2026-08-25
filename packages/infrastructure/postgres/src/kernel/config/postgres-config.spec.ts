import {describe, expect, it} from 'vitest'

import {postgresConfigSchema} from './postgres-config'

const databaseUrl = 'postgres://app:change-me-local-only@127.0.0.1:5432/app'

describe('postgresConfigSchema', () => {
  it('accepts a postgres URL and fills pool/timeout defaults', () => {
    const config = postgresConfigSchema.parse({DATABASE_URL: databaseUrl})

    expect(config.DATABASE_URL).toBe(databaseUrl)
    expect(config.POSTGRES_POOL_MAX).toBe(10)
    expect(config.POSTGRES_CONNECT_TIMEOUT_MS).toBe(5000)
    expect(config.POSTGRES_STATEMENT_TIMEOUT_MS).toBe(15_000)
    expect(config.POSTGRES_LOCK_TIMEOUT_MS).toBe(5000)
    expect(config.POSTGRES_IDLE_IN_TX_TIMEOUT_MS).toBe(30_000)
    expect(config.POSTGRES_APPLICATION_NAME).toBe('b2b-saas')
    expect(config.POSTGRES_SLOW_QUERY_MS).toBe(500)
  })

  it('coerces optional env strings', () => {
    const config = postgresConfigSchema.parse({
      DATABASE_URL: databaseUrl,
      POSTGRES_POOL_MAX: '4',
      POSTGRES_APPLICATION_NAME: 'api',
    })

    expect(config.POSTGRES_POOL_MAX).toBe(4)
    expect(config.POSTGRES_APPLICATION_NAME).toBe('api')
  })

  it('rejects a non-URL', () => {
    expect(() => {
      postgresConfigSchema.parse({DATABASE_URL: 'not-a-url'})
    }).toThrow()
  })
})
