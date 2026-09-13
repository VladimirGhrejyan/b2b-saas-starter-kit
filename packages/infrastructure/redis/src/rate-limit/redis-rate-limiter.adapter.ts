import {Inject, Injectable} from '@nestjs/common'
import type Redis from 'ioredis'

import type {RateLimitConsumeOptions, RateLimitDecision, RateLimiterPort} from '@b2b-saas-starter-kit/platform'
import {toRateLimitDecision} from '@b2b-saas-starter-kit/platform'

import {REDIS_CLIENT} from '../kernel/tokens'

@Injectable()
export class RedisRateLimiter implements RateLimiterPort {
  private static readonly consumeScript = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("TTL", KEYS[1])
return {count, ttl}
`

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async consume(key: string, options: RateLimitConsumeOptions): Promise<RateLimitDecision> {
    const raw: unknown = await this.redis.eval(RedisRateLimiter.consumeScript, 1, key, String(options.windowSeconds))

    if (!Array.isArray(raw) || raw.length < 2) {
      throw new Error('rate limiter script returned an unexpected result')
    }

    const count = Number(raw[0])
    const ttlSeconds = Number(raw[1])

    return toRateLimitDecision(count, ttlSeconds, options.limit, options.windowSeconds)
  }
}
