export type OutboxRelayOptions = {
  readonly batchSize: number
}

export type OutboxPendingRow = {
  readonly id: string
  readonly event_type: string
  readonly payload: Record<string, unknown>
  readonly tenant_id: string | null
  readonly status: string
  readonly created_at: Date
  readonly processed_at: Date | null
  readonly attempt_count: number
}
