import {describe, expect, it} from 'vitest'

import {redisConfigSchema} from './redis-config'

const redisUrl = 'redis://127.0.0.1:6379'

describe('redisConfigSchema', () => {
  it('accepts a redis URL and defaults an empty key prefix', () => {
    const config = redisConfigSchema.parse({REDIS_URL: redisUrl})

    expect(config.REDIS_URL).toBe(redisUrl)
    expect(config.REDIS_KEY_PREFIX).toBe('')
  })

  it('accepts a key prefix', () => {
    const config = redisConfigSchema.parse({REDIS_URL: redisUrl, REDIS_KEY_PREFIX: 'kit:'})

    expect(config.REDIS_KEY_PREFIX).toBe('kit:')
  })

  it('rejects a non-URL', () => {
    expect(() => {
      redisConfigSchema.parse({REDIS_URL: 'not-a-url'})
    }).toThrow()
  })
})
