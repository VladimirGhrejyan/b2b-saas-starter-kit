export type OutboxRelayOptions = {
  readonly batchSize: number
}

export type ClaimedOutboxRow = {
  readonly id: string
  readonly eventType: string
  readonly tenantId: string | null
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
