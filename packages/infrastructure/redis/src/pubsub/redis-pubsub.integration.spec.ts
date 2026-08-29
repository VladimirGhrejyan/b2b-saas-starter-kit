import {afterAll, beforeAll, beforeEach, describe, it} from 'vitest'

import {RedisTestContext} from '../kernel/testing/redis-test-context'

import {RedisPubSub} from './redis-pubsub.adapter'

describe('RedisPubSub', () => {
  let ctx: RedisTestContext
  let pubsub: RedisPubSub

  beforeAll(async () => {
    ctx = await RedisTestContext.connect()
    pubsub = new RedisPubSub(ctx.client)
  })

  afterAll(async () => {
    await pubsub?.onModuleDestroy()
    await ctx?.destroy()
  })

  beforeEach(async () => {
    await ctx.flush()
  })

  it('delivers a published payload to a subscriber', async () => {
    const received: string[] = []
    const unsubscribe = await pubsub.subscribe('authz.invalidate', (payload) => {
      received.push(payload)
    })

    await pubsub.publish('authz.invalidate', 'tenant-a')
    await waitFor(() => received.includes('tenant-a'))

    await unsubscribe()
  })
})

async function waitFor(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 2000

  while (Date.now() < deadline) {
    if (predicate()) {
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 20))
  }

  throw new Error('Timed out waiting for pub/sub payload')
}
