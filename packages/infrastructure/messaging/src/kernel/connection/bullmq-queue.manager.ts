import type {OnModuleDestroy} from '@nestjs/common'
import {Inject, Injectable} from '@nestjs/common'
import type {Queue} from 'bullmq'

import {MAINTENANCE_QUEUE, OUTBOX_QUEUE} from '../tokens'

/**
 * Closes BullMQ queues on shutdown. Does not quit the shared ioredis connection.
 */
@Injectable()
export class BullMqQueueManager implements OnModuleDestroy {
  constructor(
    @Inject(MAINTENANCE_QUEUE) private readonly maintenance: Queue,
    @Inject(OUTBOX_QUEUE) private readonly outbox: Queue,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await this.maintenance.close()
    await this.outbox.close()
  }
}
