export const QueueName = {
  maintenance: 'maintenance',
  outbox: 'outbox',
} as const

export type QueueName = (typeof QueueName)[keyof typeof QueueName]

export const MaintenanceJobName = {
  purgeRefreshSessions: 'purge-refresh-sessions',
  purgePasswordResetTokens: 'purge-password-reset-tokens',
  purgeStaleInvitations: 'purge-stale-invitations',
  reclaimStaleOutbox: 'reclaim-stale-outbox',
} as const

export type MaintenanceJobName = (typeof MaintenanceJobName)[keyof typeof MaintenanceJobName]
