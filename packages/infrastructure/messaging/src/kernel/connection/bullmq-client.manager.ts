import type {OnModuleDestroy} from '@nestjs/common'
import {Inject, Injectable} from '@nestjs/common'
import Redis from 'ioredis'

import type {MessagingConfig} from '../config/messaging-config'
import {MESSAGING_CONFIG} from '../tokens'

import {BullMqConnectionOptions} from './create-bullmq-connection-options'

/**
 * Owns the dedicated ioredis connection used by BullMQ queues and workers.
 */
@Injectable()
export class BullMqClientManager implements OnModuleDestroy {
  readonly #client: Redis

  constructor(@Inject(MESSAGING_CONFIG) config: MessagingConfig) {
    this.#client = new Redis(config.REDIS_URL, BullMqConnectionOptions.fromConfig(config))
  }

  get(): Redis {
    return this.#client
  }

  async onModuleDestroy(): Promise<void> {
    if (this.#client.status === 'ready') {
      await this.#client.quit()

      return
    }

    this.#client.disconnect()
  }
}
