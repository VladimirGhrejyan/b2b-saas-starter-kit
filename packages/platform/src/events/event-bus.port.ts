import type {IntegrationEvent} from './integration-event'

export type DomainEventHandler = (event: IntegrationEvent) => Promise<void>

/**
 * In-process dispatcher for integration events after the outbox relay claims them.
 */
export interface EventBus {
  register(type: string, handler: DomainEventHandler): void
  dispatch(events: readonly IntegrationEvent[]): Promise<void>
}
