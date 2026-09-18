import type {RedisOptions} from 'ioredis'

import type {RedisConfig} from '../config/redis-config'

/**
 * ioredis options for the shared command client (cache, lock, rate-limit, publish).
 */
export class RedisConnectionOptions {
  static retryStrategy(times: number): number | null {
    if (times > 20) {
      return null
    }

    return Math.min(times * 50, 2000)
  }

  static fromConfig(config: RedisConfig): RedisOptions {
    const options: RedisOptions = {
      keyPrefix: config.REDIS_KEY_PREFIX === '' ? undefined : config.REDIS_KEY_PREFIX,
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      enableOfflineQueue: false,
      connectTimeout: 5000,
      keepAlive: 10_000,
      retryStrategy: RedisConnectionOptions.retryStrategy,
    }

    if (new URL(config.REDIS_URL).protocol === 'rediss:') {
      options.tls = {}
    }

    return options
  }
}
