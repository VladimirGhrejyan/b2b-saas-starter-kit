import type {OnModuleDestroy} from '@nestjs/common'
import {Inject, Injectable} from '@nestjs/common'
import Redis from 'ioredis'

import type {RedisConfig} from '../config/redis-config'
import {REDIS_CONFIG} from '../tokens'

/**
 * Owns the command Redis client. Capability adapters share this instance.
 */
@Injectable()
export class RedisClientManager implements OnModuleDestroy {
  readonly #client: Redis

  constructor(@Inject(REDIS_CONFIG) config: RedisConfig) {
    this.#client = new Redis(config.REDIS_URL, {
      keyPrefix: config.REDIS_KEY_PREFIX === '' ? undefined : config.REDIS_KEY_PREFIX,
      maxRetriesPerRequest: 1,
    })
  }

  get(): Redis {
    return this.#client
  }

  async onModuleDestroy(): Promise<void> {
    await this.#client.quit()
  }
}
