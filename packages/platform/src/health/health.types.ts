export const HealthCheckStatus = {
  Up: 'up',
  Down: 'down',
} as const

export type HealthCheckStatus = (typeof HealthCheckStatus)[keyof typeof HealthCheckStatus]

export type HealthCheckResult = {
  readonly status: HealthCheckStatus
  readonly message?: string
}
