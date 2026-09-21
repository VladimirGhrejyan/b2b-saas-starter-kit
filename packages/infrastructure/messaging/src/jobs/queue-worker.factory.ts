import {Inject, Injectable} from '@nestjs/common'
import {Worker} from 'bullmq'
import type Redis from 'ioredis'

import type {MessagingConfig} from '../kernel/config/messaging-config'
import {BULLMQ_CONNECTION, MESSAGING_CONFIG} from '../kernel/tokens'

import {attachWorkerObservability} from './attach-worker-observability'
import type {JobHandler} from './job-handler.types'

/**
 * Builds BullMQ workers that share the dedicated blocking connection.
 */
@Injectable()
export class QueueWorkerFactory {
  constructor(
    @Inject(BULLMQ_CONNECTION) private readonly connection: Redis,
    @Inject(MESSAGING_CONFIG) private readonly config: MessagingConfig,
  ) {}

  create<TData>(queueName: string, handler: JobHandler<TData>): Worker<TData> {
    const worker = new Worker<TData>(
      queueName,
      async (job) => {
        await handler({
          name: job.name,
          data: job.data,
          attemptsMade: job.attemptsMade,
          maxAttempts: job.opts.attempts ?? 1,
        })
      },
      {
        connection: this.connection,
        prefix: this.config.BULLMQ_PREFIX,
      },
    )

    attachWorkerObservability(worker, queueName)

    return worker
  }
}
