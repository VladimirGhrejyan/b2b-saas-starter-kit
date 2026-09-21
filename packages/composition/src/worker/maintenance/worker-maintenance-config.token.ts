export const WORKER_MAINTENANCE_CONFIG = Symbol('WORKER_MAINTENANCE_CONFIG')

export type WorkerMaintenanceConfig = {
  readonly refreshSessionsEveryMs: number
  readonly passwordResetTokensEveryMs: number
  readonly staleInvitationsEveryMs: number
  readonly reclaimStaleOutboxEveryMs: number
  readonly staleProcessingMs: number
}
