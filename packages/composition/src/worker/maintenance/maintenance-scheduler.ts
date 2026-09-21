import {Inject, Injectable, type OnModuleInit} from '@nestjs/common'

import {ObjectUtils} from '@b2b-saas-starter-kit/utils'

import {JobScheduler, type MaintenanceJobName} from '@b2b-saas-starter-kit/messaging'

import {MAINTENANCE_JOB_SCHEDULES} from './maintenance-jobs'
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
    await Promise.all(
      ObjectUtils.keys(MAINTENANCE_JOB_SCHEDULES).map((name: MaintenanceJobName) => {
        const everyMs = MAINTENANCE_JOB_SCHEDULES[name]

        return this.scheduler.upsertJobScheduler(name, everyMs(this.config))
      }),
    )
  }
}
