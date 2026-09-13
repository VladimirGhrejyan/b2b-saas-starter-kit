import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {RedisTestContext} from '../kernel/testing/redis-test-context'

import {RedisRateLimiter} from './redis-rate-limiter.adapter'

describe('RedisRateLimiter', () => {
  let ctx: RedisTestContext
  let limiter: RedisRateLimiter

  beforeAll(async () => {
    ctx = await RedisTestContext.connect()
    limiter = new RedisRateLimiter(ctx.client)
  })

  afterAll(async () => {
    await ctx?.destroy()
  })

  beforeEach(async () => {
    await ctx.flush()
  })

  it('allows until the limit then denies with retryAfterSeconds', async () => {
    await expect(limiter.consume('login', {limit: 2, windowSeconds: 30})).resolves.toMatchObject({
      allowed: true,
      remaining: 1,
      retryAfterSeconds: 0,
    })
    await expect(limiter.consume('login', {limit: 2, windowSeconds: 30})).resolves.toMatchObject({
      allowed: true,
      remaining: 0,
      retryAfterSeconds: 0,
    })

    const denied = await limiter.consume('login', {limit: 2, windowSeconds: 30})

    expect(denied.allowed).toBe(false)
    expect(denied.remaining).toBe(0)
    expect(denied.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('resets after the window expires', async () => {
    await limiter.consume('burst', {limit: 1, windowSeconds: 1})

    const denied = await limiter.consume('burst', {limit: 1, windowSeconds: 1})

    expect(denied.allowed).toBe(false)

    await new Promise((resolve) => {
      setTimeout(resolve, 1100)
    })

    await expect(limiter.consume('burst', {limit: 1, windowSeconds: 1})).resolves.toMatchObject({
      allowed: true,
      remaining: 0,
    })
  })
})
