import {describe, expect, it} from 'vitest'

import {BullMqConnectionOptions} from './create-bullmq-connection-options'

describe('BullMqConnectionOptions.retryStrategy', () => {
  it('grows by 50ms per attempt', () => {
    expect(BullMqConnectionOptions.retryStrategy(1)).toBe(50)
    expect(BullMqConnectionOptions.retryStrategy(10)).toBe(500)
    expect(BullMqConnectionOptions.retryStrategy(20)).toBe(1000)
  })

  it('stops reconnecting after 20 attempts', () => {
    expect(BullMqConnectionOptions.retryStrategy(21)).toBeNull()
  })
})

describe('BullMqConnectionOptions.fromConfig', () => {
  it('uses BullMQ blocking defaults and omits a cache keyPrefix', () => {
    const options = BullMqConnectionOptions.fromConfig({
      REDIS_URL: 'redis://127.0.0.1:6379',
      BULLMQ_PREFIX: 'bsk:bull',
    })

    expect(options.maxRetriesPerRequest).toBeNull()
    expect(options.enableOfflineQueue).toBe(true)
    expect(options.keyPrefix).toBeUndefined()
    expect(options.tls).toBeUndefined()
    expect(options.enableReadyCheck).toBe(true)
    expect(options.connectTimeout).toBe(5000)
    expect(options.keepAlive).toBe(10_000)
    expect(options.retryStrategy).toBe(BullMqConnectionOptions.retryStrategy)
  })

  it('sets tls for rediss://', () => {
    const options = BullMqConnectionOptions.fromConfig({
      REDIS_URL: 'rediss://example.internal:6379',
      BULLMQ_PREFIX: 'bsk:bull',
    })

    expect(options.tls).toEqual({})
    expect(options.maxRetriesPerRequest).toBeNull()
  })
})
