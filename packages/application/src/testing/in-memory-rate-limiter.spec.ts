import {describe, expect, it} from 'vitest'

import {InMemoryRateLimiter} from './in-memory-rate-limiter'

describe('InMemoryRateLimiter', () => {
  it('allows up to the limit then denies', async () => {
    const limiter = new InMemoryRateLimiter()

    await expect(limiter.consume('login', {limit: 2, windowSeconds: 60})).resolves.toEqual({
      allowed: true,
      remaining: 1,
      retryAfterSeconds: 0,
    })
    await expect(limiter.consume('login', {limit: 2, windowSeconds: 60})).resolves.toEqual({
      allowed: true,
      remaining: 0,
      retryAfterSeconds: 0,
    })

    const denied = await limiter.consume('login', {limit: 2, windowSeconds: 60})

    expect(denied.allowed).toBe(false)
    expect(denied.remaining).toBe(0)
    expect(denied.retryAfterSeconds).toBeGreaterThan(0)
  })
})
