import type {OnModuleDestroy} from '@nestjs/common'
import {Inject, Injectable} from '@nestjs/common'
import type Redis from 'ioredis'

import type {PubSubPort, Unsubscribe} from '@b2b-saas-starter-kit/platform'

import {REDIS_CLIENT} from '../kernel/tokens'

@Injectable()
export class RedisPubSub implements PubSubPort, OnModuleDestroy {
  readonly #subscriber: Redis

  constructor(@Inject(REDIS_CLIENT) private readonly publisher: Redis) {
    this.#subscriber = this.publisher.duplicate()
  }

  async publish(channel: string, payload: string): Promise<void> {
    await this.publisher.publish(channel, payload)
  }

  async subscribe(channel: string, handler: (payload: string) => void): Promise<Unsubscribe> {
    const listener = (receivedChannel: string, message: string): void => {
      if (receivedChannel === channel) {
        handler(message)
      }
    }

    this.#subscriber.on('message', listener)
    await this.#subscriber.subscribe(channel)

    return async () => {
      this.#subscriber.off('message', listener)
      await this.#subscriber.unsubscribe(channel)
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.#subscriber.quit()
  }
}
