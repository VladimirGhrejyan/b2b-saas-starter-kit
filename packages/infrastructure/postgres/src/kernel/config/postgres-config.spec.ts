import {describe, expect, it} from 'vitest'

import {postgresConfigSchema} from './postgres-config'

describe('postgresConfigSchema', () => {
  it('accepts a postgres URL', () => {
    const config = postgresConfigSchema.parse({
      DATABASE_URL: 'postgres://app:change-me-local-only@127.0.0.1:5432/app',
    })

    expect(config.DATABASE_URL).toBe('postgres://app:change-me-local-only@127.0.0.1:5432/app')
  })

  it('rejects a non-URL', () => {
    expect(() => {
      postgresConfigSchema.parse({DATABASE_URL: 'not-a-url'})
    }).toThrow()
  })
})
