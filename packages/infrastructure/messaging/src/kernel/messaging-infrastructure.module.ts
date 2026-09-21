import type {DynamicModule} from '@nestjs/common'
import {Module} from '@nestjs/common'
import {Queue} from 'bullmq'

import {DefaultJobOptions} from '../jobs/default-job-options'
import {JobScheduler} from '../jobs/job-scheduler'
import {QueueWorkerFactory} from '../jobs/queue-worker.factory'

import type {MessagingConfig} from './config/messaging-config'
import {BullMqClientManager} from './connection/bullmq-client.manager'
import {BullMqQueueManager} from './connection/bullmq-queue.manager'
import type {MessagingInfrastructureModuleAsyncOptions} from './messaging-infrastructure.module.types'
import {QueueName} from './queue-names'
import {BULLMQ_CONNECTION, MAINTENANCE_QUEUE, MESSAGING_CONFIG, OUTBOX_QUEUE} from './tokens'

/**
 * Nest wrapper around dedicated BullMQ queues. Processors live in composition.
 */
@Module({})
export class MessagingInfrastructureModule {
  static forRootAsync(options: MessagingInfrastructureModuleAsyncOptions): DynamicModule {
    return {
      module: MessagingInfrastructureModule,
      global: true,
      providers: [
        {
          provide: MESSAGING_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        BullMqClientManager,
        {
          provide: BULLMQ_CONNECTION,
          useFactory: (manager: BullMqClientManager) => manager.get(),
          inject: [BullMqClientManager],
        },
        {
          provide: MAINTENANCE_QUEUE,
          useFactory: (manager: BullMqClientManager, config: MessagingConfig) =>
            new Queue(QueueName.maintenance, {
              connection: manager.get(),
              prefix: config.BULLMQ_PREFIX,
              defaultJobOptions: DefaultJobOptions.value,
            }),
          inject: [BullMqClientManager, MESSAGING_CONFIG],
        },
        {
          provide: OUTBOX_QUEUE,
          useFactory: (manager: BullMqClientManager, config: MessagingConfig) =>
            new Queue(QueueName.outbox, {
              connection: manager.get(),
              prefix: config.BULLMQ_PREFIX,
              defaultJobOptions: DefaultJobOptions.value,
            }),
          inject: [BullMqClientManager, MESSAGING_CONFIG],
        },
        JobScheduler,
        QueueWorkerFactory,
        BullMqQueueManager,
      ],
      exports: [MESSAGING_CONFIG, BULLMQ_CONNECTION, MAINTENANCE_QUEUE, OUTBOX_QUEUE, JobScheduler, QueueWorkerFactory],
    }
  }
}
