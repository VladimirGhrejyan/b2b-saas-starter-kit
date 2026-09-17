import type {DomainEvent} from '../domain-events'

import type {DomainEventBase} from './domain-event-base'
import {Entity} from './entity'

/**
 * Consistency boundary that records domain events until the application pulls them.
 *
 * Subclasses call {@link AggregateRoot.record} after a successful state change.
 * Use cases persist the aggregate, then {@link AggregateRoot.pullEvents} and
 * dispatch — the aggregate never talks to a bus.
 */
export class AggregateRoot<TId, TEvent extends DomainEventBase = DomainEvent> extends Entity<TId> {
  #events: TEvent[] = []

  /**
   * Appends an uncommitted domain event.
   *
   * @param event - Event that already happened (`occurredAt` must be set by the caller).
   */
  protected record(event: TEvent): void {
    this.#events.push(event)
  }

  /**
   * Returns a copy of uncommitted events and clears the buffer.
   *
   * @returns Recorded events in insertion order.
   */
  pullEvents(): TEvent[] {
    const events = [...this.#events]

    this.#events = []

    return events
  }
}
