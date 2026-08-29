import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {RedisTestContext} from '../kernel/testing/redis-test-context'

import {RedisCache} from './redis-cache.adapter'

describe('RedisCache', () => {
  let ctx: RedisTestContext
  let cache: RedisCache

  beforeAll(async () => {
    ctx = await RedisTestContext.connect()
    cache = new RedisCache(ctx.client)
  })

  afterAll(async () => {
    await ctx?.destroy()
  })

  beforeEach(async () => {
    await ctx.flush()
  })

  it('round-trips JSON values and deletes them', async () => {
    await cache.set('permissions', ['tenancy.members.read'], 60)

    await expect(cache.get<string[]>('permissions')).resolves.toEqual(['tenancy.members.read'])

    await cache.del('permissions')

    await expect(cache.get('permissions')).resolves.toBeNull()
  })

  it('sets a TTL on write', async () => {
    await cache.set('ephemeral', {ok: true}, 30)

    const ttl = await ctx.client.ttl('ephemeral')

    expect(ttl).toBeGreaterThan(0)
    expect(ttl).toBeLessThanOrEqual(30)
  })
})
