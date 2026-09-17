import type {IntegrationEvent} from './integration-event'

/**
 * Persists domain events for durable delivery (typically a transactional outbox).
 */
export interface EventPublisher {
  publish(events: readonly IntegrationEvent[]): Promise<void>
}
