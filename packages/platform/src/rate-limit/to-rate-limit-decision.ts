import type {RateLimitDecision} from './rate-limit.types'

/**
 * Maps a window counter and Redis/in-memory TTL onto an allow/deny decision.
 */
export function toRateLimitDecision(
  count: number,
  ttlSeconds: number,
  limit: number,
  windowSeconds: number,
): RateLimitDecision {
  const allowed = count <= limit
  const remaining = Math.max(0, limit - count)

  if (allowed) {
    return {allowed, remaining, retryAfterSeconds: 0}
  }

  const retryAfterSeconds = ttlSeconds > 0 ? ttlSeconds : windowSeconds

  return {allowed, remaining, retryAfterSeconds: Math.max(1, retryAfterSeconds)}
}
