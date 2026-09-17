/**
 * Minimal event shape for platform ports. Domain events satisfy this structurally.
 */
export type IntegrationEvent = {
  readonly type: string
  readonly occurredAt: Date
}
