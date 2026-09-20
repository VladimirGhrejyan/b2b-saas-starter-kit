import {Inject, Injectable, type OnModuleInit} from '@nestjs/common'

import {JobScheduler, MaintenanceJobName} from '@b2b-saas-starter-kit/messaging'

import {WORKER_MAINTENANCE_CONFIG, type WorkerMaintenanceConfig} from './worker-maintenance-config.token'

/**
 * Registers repeatable maintenance jobs on worker boot.
 */
@Injectable()
export class MaintenanceScheduler implements OnModuleInit {
  constructor(
    private readonly scheduler: JobScheduler,
    @Inject(WORKER_MAINTENANCE_CONFIG) private readonly config: WorkerMaintenanceConfig,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.scheduler.upsertJobScheduler(MaintenanceJobName.purgeRefreshSessions, this.config.refreshSessionsEveryMs)
    await this.scheduler.upsertJobScheduler(
      MaintenanceJobName.purgePasswordResetTokens,
      this.config.passwordResetTokensEveryMs,
    )
    await this.scheduler.upsertJobScheduler(
      MaintenanceJobName.purgeStaleInvitations,
      this.config.staleInvitationsEveryMs,
    )
    await this.scheduler.upsertJobScheduler(
      MaintenanceJobName.reclaimStaleOutbox,
      this.config.reclaimStaleOutboxEveryMs,
    )
  }
}
