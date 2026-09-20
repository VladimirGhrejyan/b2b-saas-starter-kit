import type {RedisOptions} from 'ioredis'

import type {MessagingConfig} from '../config/messaging-config'

/**
 * ioredis options for the dedicated BullMQ connection (blocking, no cache keyPrefix).
 */
export class BullMqConnectionOptions {
  static retryStrategy(times: number): number | null {
    if (times > 20) {
      return null
    }

    return Math.min(times * 50, 2000)
  }

  static fromConfig(config: MessagingConfig): RedisOptions {
    const options: RedisOptions = {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      connectTimeout: 5000,
      keepAlive: 10_000,
      retryStrategy: BullMqConnectionOptions.retryStrategy,
    }

    if (new URL(config.REDIS_URL).protocol === 'rediss:') {
      options.tls = {}
    }

    return options
  }
}
