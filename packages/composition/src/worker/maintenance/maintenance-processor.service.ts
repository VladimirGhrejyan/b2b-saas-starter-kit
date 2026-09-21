import {Inject, Injectable, type OnModuleDestroy, type OnModuleInit} from '@nestjs/common'

import {DateUtils, ObjectUtils} from '@b2b-saas-starter-kit/utils'

import type {Clock} from '@b2b-saas-starter-kit/platform'
import {CLOCK, LoggerLocator} from '@b2b-saas-starter-kit/platform'

import {
  PURGE_BATCH_SIZE,
  PurgePasswordResetTokensUseCase,
  PurgeRefreshSessionsUseCase,
  PurgeStaleInvitationsUseCase,
} from '@b2b-saas-starter-kit/application'

import {OutboxRelay} from '@b2b-saas-starter-kit/postgres'
import {JobScheduler, MaintenanceJobName, QueueName, QueueWorkerFactory} from '@b2b-saas-starter-kit/messaging'

import {WORKER_MAINTENANCE_CONFIG, type WorkerMaintenanceConfig} from './worker-maintenance-config.token'

/**
 * Runs cleanup and stale-outbox reclaim jobs from the maintenance queue.
 */
@Injectable()
export class MaintenanceProcessorService implements OnModuleInit, OnModuleDestroy {
  #worker: {close(): Promise<void>} | undefined

  private readonly logger = LoggerLocator.get().context(MaintenanceProcessorService.name)

  private readonly handlers: Record<MaintenanceJobName, () => Promise<number>>

  constructor(
    private readonly workers: QueueWorkerFactory,
    private readonly scheduler: JobScheduler,
    private readonly purgeRefreshSessions: PurgeRefreshSessionsUseCase,
    private readonly purgePasswordResetTokens: PurgePasswordResetTokensUseCase,
    private readonly purgeStaleInvitations: PurgeStaleInvitationsUseCase,
    private readonly outboxRelay: OutboxRelay,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(WORKER_MAINTENANCE_CONFIG) private readonly config: WorkerMaintenanceConfig,
  ) {
    this.handlers = {
      [MaintenanceJobName.purgeRefreshSessions]: async () => (await this.purgeRefreshSessions.execute()).deleted,
      [MaintenanceJobName.purgePasswordResetTokens]: async () =>
        (await this.purgePasswordResetTokens.execute()).deleted,
      [MaintenanceJobName.purgeStaleInvitations]: async () => (await this.purgeStaleInvitations.execute()).deleted,
      [MaintenanceJobName.reclaimStaleOutbox]: () => this.#reclaimStaleOutbox(),
    }
  }

  onModuleInit(): void {
    this.#worker = this.workers.create(QueueName.maintenance, async (job) => {
      const deleted = await this.#run(job.name)

      if (deleted === PURGE_BATCH_SIZE) {
        await this.scheduler.addMaintenanceJob(job.name)
      }
    })
  }

  async onModuleDestroy(): Promise<void> {
    await this.#worker?.close()
  }

  async #run(name: string): Promise<number> {
    if (!ObjectUtils.hasOwn(this.handlers, name)) {
      this.logger.warn({jobName: name}, 'unknown maintenance job')
      throw new Error(`Unknown maintenance job: ${name}`)
    }

    return this.handlers[name as MaintenanceJobName]()
  }

  #reclaimStaleOutbox(): Promise<number> {
    const olderThan = DateUtils.fromUnixMs(DateUtils.toUnixMs(this.clock.now()) - this.config.staleProcessingMs)

    return this.outboxRelay.reclaimStaleProcessing(olderThan, PURGE_BATCH_SIZE)
  }
}
