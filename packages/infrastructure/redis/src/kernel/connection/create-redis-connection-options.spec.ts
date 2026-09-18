import {describe, expect, it} from 'vitest'

import {RedisConnectionOptions} from './create-redis-connection-options'

describe('RedisConnectionOptions.retryStrategy', () => {
  it('grows by 50ms per attempt', () => {
    expect(RedisConnectionOptions.retryStrategy(1)).toBe(50)
    expect(RedisConnectionOptions.retryStrategy(10)).toBe(500)
    expect(RedisConnectionOptions.retryStrategy(20)).toBe(1000)
  })

  it('stops reconnecting after 20 attempts', () => {
    expect(RedisConnectionOptions.retryStrategy(21)).toBeNull()
  })
})

describe('RedisConnectionOptions.fromConfig', () => {
  it('omits tls for redis:// and keeps command-client defaults', () => {
    const options = RedisConnectionOptions.fromConfig({
      REDIS_URL: 'redis://127.0.0.1:6379',
      REDIS_KEY_PREFIX: '',
    })

    expect(options.tls).toBeUndefined()
    expect(options.keyPrefix).toBeUndefined()
    expect(options.maxRetriesPerRequest).toBe(1)
    expect(options.enableOfflineQueue).toBe(false)
    expect(options.enableReadyCheck).toBe(true)
    expect(options.connectTimeout).toBe(5000)
    expect(options.keepAlive).toBe(10_000)
    expect(options.retryStrategy).toBe(RedisConnectionOptions.retryStrategy)
  })

  it('sets tls for rediss:// and keeps a key prefix', () => {
    const options = RedisConnectionOptions.fromConfig({
      REDIS_URL: 'rediss://example.internal:6379',
      REDIS_KEY_PREFIX: 'kit:',
    })

    expect(options.tls).toEqual({})
    expect(options.keyPrefix).toBe('kit:')
  })
})
