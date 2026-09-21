import {MaintenanceJobName} from '@b2b-saas-starter-kit/messaging'

import type {WorkerMaintenanceConfig} from './worker-maintenance-config.token'

export const MAINTENANCE_JOB_SCHEDULES: {
  readonly [K in MaintenanceJobName]: (config: WorkerMaintenanceConfig) => number
} = {
  [MaintenanceJobName.purgeRefreshSessions]: (config) => config.refreshSessionsEveryMs,
  [MaintenanceJobName.purgePasswordResetTokens]: (config) => config.passwordResetTokensEveryMs,
  [MaintenanceJobName.purgeStaleInvitations]: (config) => config.staleInvitationsEveryMs,
  [MaintenanceJobName.reclaimStaleOutbox]: (config) => config.reclaimStaleOutboxEveryMs,
}
