export type SerializedDomainEvent = Record<string, unknown> & {
  readonly type: string
  readonly occurredAt: string
}
