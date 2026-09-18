import {Inject, Injectable} from '@nestjs/common'
import type Redis from 'ioredis'

import type {HealthCheckResult, HealthIndicator} from '@b2b-saas-starter-kit/platform'
import {HealthCheckStatus} from '@b2b-saas-starter-kit/platform'

import {REDIS_CLIENT} from '../tokens'

/**
 * Readiness probe for Redis. Uses the shared command client `PING`.
 */
@Injectable()
export class RedisHealthIndicator implements HealthIndicator {
  readonly name = 'redis'

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async check(): Promise<HealthCheckResult> {
    try {
      await this.redis.ping()

      return {status: HealthCheckStatus.Up}
    } catch {
      return {status: HealthCheckStatus.Down, message: 'unreachable'}
    }
  }
}
