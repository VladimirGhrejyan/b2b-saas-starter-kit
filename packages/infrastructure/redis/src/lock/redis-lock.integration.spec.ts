import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {RedisTestContext} from '../kernel/testing/redis-test-context'

import {RedisLock} from './redis-lock.adapter'

describe('RedisLock', () => {
  let ctx: RedisTestContext
  let lock: RedisLock

  beforeAll(async () => {
    ctx = await RedisTestContext.connect()
    lock = new RedisLock(ctx.client)
  })

  afterAll(async () => {
    await ctx?.destroy()
  })

  beforeEach(async () => {
    await ctx.flush()
  })

  it('acquires once and rejects a second holder until release', async () => {
    const first = await lock.acquire('job:1', 30)

    expect(first).not.toBeNull()

    if (first === null) {
      return
    }

    await expect(lock.acquire('job:1', 30)).resolves.toBeNull()

    await lock.release(first)

    const second = await lock.acquire('job:1', 30)

    expect(second).not.toBeNull()

    if (second === null) {
      return
    }

    expect(second.token).not.toBe(first.token)
  })

  it('does not unlock a later owner with a stale lease', async () => {
    const first = await lock.acquire('job:2', 30)

    expect(first).not.toBeNull()

    if (first === null) {
      return
    }

    await ctx.client.del('job:2')

    const second = await lock.acquire('job:2', 30)

    expect(second).not.toBeNull()

    if (second === null) {
      return
    }

    await lock.release(first)

    await expect(ctx.client.get('job:2')).resolves.toBe(second.token)
  })
})
