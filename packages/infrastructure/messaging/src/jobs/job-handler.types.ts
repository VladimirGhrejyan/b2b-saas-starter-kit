export type JobHandler<TData = unknown> = (job: {
  readonly name: string
  readonly data: TData
  readonly attemptsMade: number
  readonly maxAttempts: number
}) => Promise<void>

export type OutboxJobPayload = {
  readonly outboxId: string
  readonly eventType: string
  readonly tenantId: string | null
}
