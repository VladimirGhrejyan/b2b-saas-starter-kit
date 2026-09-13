import {describe, expect, it} from 'vitest'

import {RateLimitExceededError} from './rate-limit-exceeded.error'
import {toRateLimitDecision} from './to-rate-limit-decision'

describe('toRateLimitDecision', () => {
  it('allows counts at the limit and reports remaining', () => {
    expect(toRateLimitDecision(1, 60, 2, 60)).toEqual({
      allowed: true,
      remaining: 1,
      retryAfterSeconds: 0,
    })
    expect(toRateLimitDecision(2, 60, 2, 60)).toEqual({
      allowed: true,
      remaining: 0,
      retryAfterSeconds: 0,
    })
  })

  it('denies over-limit counts and uses TTL as retry-after', () => {
    expect(toRateLimitDecision(3, 42, 2, 60)).toEqual({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 42,
    })
  })

  it('falls back to the window when TTL is missing', () => {
    expect(toRateLimitDecision(3, -1, 2, 90)).toEqual({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 90,
    })
  })
})

describe('RateLimitExceededError', () => {
  it('exposes RATE_LIMIT_EXCEEDED and retryAfterSeconds', () => {
    const error = new RateLimitExceededError(15)

    expect(error.code).toBe('RATE_LIMIT_EXCEEDED')
    expect(error.retryAfterSeconds).toBe(15)
    expect(error.message).toBe('Too many requests')
  })
})
