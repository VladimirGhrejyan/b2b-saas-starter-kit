import {describe, expect, it} from 'vitest'

import {loadMessagingConfigFromEnv} from './load-messaging-config'

describe('loadMessagingConfigFromEnv', () => {
  it('defaults the BullMQ prefix', () => {
    expect(loadMessagingConfigFromEnv({REDIS_URL: 'redis://127.0.0.1:6379'})).toEqual({
      REDIS_URL: 'redis://127.0.0.1:6379',
      BULLMQ_PREFIX: 'bsk:bull',
    })
  })

  it('keeps an explicit prefix', () => {
    expect(
      loadMessagingConfigFromEnv({
        REDIS_URL: 'redis://127.0.0.1:6379',
        BULLMQ_PREFIX: 'kit:bull',
      }),
    ).toEqual({
      REDIS_URL: 'redis://127.0.0.1:6379',
      BULLMQ_PREFIX: 'kit:bull',
    })
  })
})
