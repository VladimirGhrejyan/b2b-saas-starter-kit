import type {DomainEvent} from '@b2b-saas-starter-kit/domain'

import type {EventPublisher, IntegrationEvent} from '@b2b-saas-starter-kit/platform'

/**
 * Captures published events for application-layer specs.
 */
export class RecordingEventPublisher implements EventPublisher {
  readonly published: DomainEvent[] = []

  publish(events: readonly IntegrationEvent[]): Promise<void> {
    this.published.push(...(events as DomainEvent[]))

    return Promise.resolve()
  }
}
