import {describe, expect, it} from 'vitest'

import {loadPostgresConfigFromEnv} from './load-postgres-config'

const databaseUrl = 'postgres://app:change-me-local-only@127.0.0.1:5432/app'

describe('loadPostgresConfigFromEnv', () => {
  it('loads DATABASE_URL and applies pool/timeout defaults', () => {
    const config = loadPostgresConfigFromEnv({DATABASE_URL: databaseUrl})

    expect(config.DATABASE_URL).toBe(databaseUrl)
    expect(config.POSTGRES_POOL_MAX).toBe(10)
    expect(config.POSTGRES_SLOW_QUERY_MS).toBe(500)
  })

  it('loads optional pool overrides from env', () => {
    const config = loadPostgresConfigFromEnv({
      DATABASE_URL: databaseUrl,
      POSTGRES_POOL_MAX: '8',
      POSTGRES_APPLICATION_NAME: 'worker',
    })

    expect(config.POSTGRES_POOL_MAX).toBe(8)
    expect(config.POSTGRES_APPLICATION_NAME).toBe('worker')
  })
})
