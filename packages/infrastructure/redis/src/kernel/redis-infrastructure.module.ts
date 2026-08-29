import type {DynamicModule} from '@nestjs/common'
import {Module} from '@nestjs/common'

import {RedisCache} from '../cache/redis-cache.adapter'
import {RedisLock} from '../lock/redis-lock.adapter'
import {RedisPubSub} from '../pubsub/redis-pubsub.adapter'

import {RedisClientManager} from './connection/redis-client.manager'
import type {RedisInfrastructureModuleAsyncOptions} from './redis-infrastructure.module.types'
import {CACHE, LOCK, PUBSUB, REDIS_CLIENT, REDIS_CONFIG} from './tokens'

/**
 * Nest wrapper around one ioredis client shared by cache, lock, and pub/sub adapters.
 */
@Module({})
export class RedisInfrastructureModule {
  static forRootAsync(options: RedisInfrastructureModuleAsyncOptions): DynamicModule {
    return {
      module: RedisInfrastructureModule,
      global: true,
      providers: [
        {
          provide: REDIS_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        RedisClientManager,
        {
          provide: REDIS_CLIENT,
          useFactory: (manager: RedisClientManager) => manager.get(),
          inject: [RedisClientManager],
        },
        RedisCache,
        {
          provide: CACHE,
          useExisting: RedisCache,
        },
        RedisLock,
        {
          provide: LOCK,
          useExisting: RedisLock,
        },
        RedisPubSub,
        {
          provide: PUBSUB,
          useExisting: RedisPubSub,
        },
      ],
      exports: [REDIS_CONFIG, REDIS_CLIENT, RedisCache, CACHE, RedisLock, LOCK, RedisPubSub, PUBSUB],
    }
  }
}
