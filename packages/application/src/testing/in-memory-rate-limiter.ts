import type {RateLimitConsumeOptions, RateLimitDecision, RateLimiterPort} from '@b2b-saas-starter-kit/platform'
import {toRateLimitDecision} from '@b2b-saas-starter-kit/platform'

import type {InMemoryRateLimitEntry} from './in-memory-rate-limiter.types'

/**
 * In-memory {@link RateLimiterPort} for unit tests.
 */
export class InMemoryRateLimiter implements RateLimiterPort {
  readonly #store = new Map<string, InMemoryRateLimitEntry>()

  consume(key: string, options: RateLimitConsumeOptions): Promise<RateLimitDecision> {
    const now = Date.now()
    const existing = this.#store.get(key)
    const entry: InMemoryRateLimitEntry =
      existing === undefined || now >= existing.expiresAt
        ? {count: 1, expiresAt: now + options.windowSeconds * 1000}
        : {count: existing.count + 1, expiresAt: existing.expiresAt}

    this.#store.set(key, entry)

    const ttlSeconds = Math.ceil((entry.expiresAt - now) / 1000)

    return Promise.resolve(toRateLimitDecision(entry.count, ttlSeconds, options.limit, options.windowSeconds))
  }
}
