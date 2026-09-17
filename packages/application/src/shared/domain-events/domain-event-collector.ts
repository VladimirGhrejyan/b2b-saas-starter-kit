import type {DomainEvent} from '@b2b-saas-starter-kit/domain'

import type {EventPublisher} from '@b2b-saas-starter-kit/platform'

import type {EventSource} from './domain-event-collector.types'

/**
 * Collects uncommitted domain events from aggregates and publishes them in one batch.
 */
export class DomainEventCollector {
  readonly #events: DomainEvent[] = []

  collect(...aggregates: EventSource[]): void {
    for (const aggregate of aggregates) {
      this.#events.push(...aggregate.pullEvents())
    }
  }

  async publish(publisher: EventPublisher): Promise<void> {
    if (this.#events.length > 0) {
      await publisher.publish(this.#events)
    }
  }

  get events(): readonly DomainEvent[] {
    return this.#events
  }
}
