import {describe, expect, it, vi} from 'vitest'

import {DateUtils, ObjectUtils} from '@b2b-saas-starter-kit/utils'

import type {JobScheduler} from '@b2b-saas-starter-kit/messaging'

import {MAINTENANCE_JOB_SCHEDULES} from './maintenance-jobs'
import {MaintenanceScheduler} from './maintenance-scheduler'
import type {WorkerMaintenanceConfig} from './worker-maintenance-config.token'

describe('MaintenanceScheduler', () => {
  it('registers every maintenance job with its configured interval', async () => {
    const config: WorkerMaintenanceConfig = {
      refreshSessionsEveryMs: DateUtils.secToMs(DateUtils.hourToSec(1)),
      passwordResetTokensEveryMs: DateUtils.secToMs(DateUtils.dayToSec(1)),
      staleInvitationsEveryMs: DateUtils.secToMs(DateUtils.dayToSec(1)),
      reclaimStaleOutboxEveryMs: DateUtils.secToMs(DateUtils.minToSec(1)),
      staleProcessingMs: DateUtils.secToMs(DateUtils.minToSec(5)),
    }

    const scheduler = {
      upsertJobScheduler: vi.fn(async () => undefined),
    } satisfies Pick<JobScheduler, 'upsertJobScheduler'>

    await new MaintenanceScheduler(scheduler as unknown as JobScheduler, config).onModuleInit()

    expect(scheduler.upsertJobScheduler).toHaveBeenCalledTimes(ObjectUtils.keys(MAINTENANCE_JOB_SCHEDULES).length)

    for (const name of ObjectUtils.keys(MAINTENANCE_JOB_SCHEDULES)) {
      expect(scheduler.upsertJobScheduler).toHaveBeenCalledWith(name, MAINTENANCE_JOB_SCHEDULES[name](config))
    }
  })
})
