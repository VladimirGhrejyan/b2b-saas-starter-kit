import {Global, Module} from '@nestjs/common'

import type {HealthIndicator} from '@b2b-saas-starter-kit/platform'
import {HEALTH_INDICATORS} from '@b2b-saas-starter-kit/platform'

import {PostgresHealthIndicator} from '@b2b-saas-starter-kit/postgres'
import {RedisHealthIndicator} from '@b2b-saas-starter-kit/redis'

/**
 * Registers readiness indicators globally so `nest-http` `HealthModule` can inject them
 * without importing composition.
 */
@Global()
@Module({
  providers: [
    {
      provide: HEALTH_INDICATORS,
      useFactory: (postgres: PostgresHealthIndicator, redis: RedisHealthIndicator): readonly HealthIndicator[] => [
        postgres,
        redis,
      ],
      inject: [PostgresHealthIndicator, RedisHealthIndicator],
    },
  ],
  exports: [HEALTH_INDICATORS],
})
export class HealthIndicatorsModule {}
