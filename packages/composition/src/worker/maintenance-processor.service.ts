import {Inject, Injectable, type OnModuleDestroy, type OnModuleInit} from '@nestjs/common'

import type {Clock} from '@b2b-saas-starter-kit/platform'
import {CLOCK} from '@b2b-saas-starter-kit/platform'

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

  constructor(
    private readonly workers: QueueWorkerFactory,
    private readonly scheduler: JobScheduler,
    private readonly purgeRefreshSessions: PurgeRefreshSessionsUseCase,
    private readonly purgePasswordResetTokens: PurgePasswordResetTokensUseCase,
    private readonly purgeStaleInvitations: PurgeStaleInvitationsUseCase,
    private readonly outboxRelay: OutboxRelay,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(WORKER_MAINTENANCE_CONFIG) private readonly config: WorkerMaintenanceConfig,
  ) {}

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
    if (name === MaintenanceJobName.purgeRefreshSessions) {
      return (await this.purgeRefreshSessions.execute()).deleted
    }

    if (name === MaintenanceJobName.purgePasswordResetTokens) {
      return (await this.purgePasswordResetTokens.execute()).deleted
    }

    if (name === MaintenanceJobName.purgeStaleInvitations) {
      return (await this.purgeStaleInvitations.execute()).deleted
    }

    if (name === MaintenanceJobName.reclaimStaleOutbox) {
      const olderThan = new Date(this.clock.now().getTime() - this.config.staleProcessingMs)

      return this.outboxRelay.reclaimStaleProcessing(olderThan, PURGE_BATCH_SIZE)
    }

    return 0
  }
}
