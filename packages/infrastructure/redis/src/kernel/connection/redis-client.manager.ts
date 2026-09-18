import type {OnModuleDestroy, OnModuleInit} from '@nestjs/common'
import {Inject, Injectable} from '@nestjs/common'
import Redis from 'ioredis'

import type {RedisConfig} from '../config/redis-config'
import {REDIS_CONFIG} from '../tokens'

import {RedisConnectionOptions} from './create-redis-connection-options'
import {RedisReady} from './redis-ready'

/**
 * Owns the command Redis client. Capability adapters share this instance.
 */
@Injectable()
export class RedisClientManager implements OnModuleInit, OnModuleDestroy {
  readonly #client: Redis

  constructor(@Inject(REDIS_CONFIG) config: RedisConfig) {
    this.#client = new Redis(config.REDIS_URL, RedisConnectionOptions.fromConfig(config))
  }

  get(): Redis {
    return this.#client
  }

  async onModuleInit(): Promise<void> {
    await RedisReady.wait(this.#client)
  }

  async onModuleDestroy(): Promise<void> {
    if (this.#client.status === 'ready') {
      await this.#client.quit()

      return
    }

    this.#client.disconnect()
  }
}
