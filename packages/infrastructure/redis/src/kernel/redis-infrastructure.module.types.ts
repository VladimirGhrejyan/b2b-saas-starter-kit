import type {InjectionToken} from '@nestjs/common'

import type {RedisConfig} from './config/redis-config'

export type RedisInfrastructureModuleAsyncOptions = {
  readonly useFactory: (...args: unknown[]) => RedisConfig | Promise<RedisConfig>
  readonly inject?: InjectionToken[]
}
