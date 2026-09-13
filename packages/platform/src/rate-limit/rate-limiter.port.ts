import type {RateLimitConsumeOptions, RateLimitDecision} from './rate-limit.types'

/**
 * Fixed-window counter. Callers build keys (for example CacheKey.global).
 */
export interface RateLimiterPort {
  consume(key: string, options: RateLimitConsumeOptions): Promise<RateLimitDecision>
}
