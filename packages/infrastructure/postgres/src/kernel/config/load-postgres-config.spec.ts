import {describe, expect, it} from 'vitest'

import {loadPostgresConfigFromEnv} from './load-postgres-config'

describe('loadPostgresConfigFromEnv', () => {
  it('loads DATABASE_URL from an explicit env object', () => {
    const config = loadPostgresConfigFromEnv({
      DATABASE_URL: 'postgres://app:change-me-local-only@127.0.0.1:5432/app',
    })

    expect(config.DATABASE_URL).toBe('postgres://app:change-me-local-only@127.0.0.1:5432/app')
  })
})
