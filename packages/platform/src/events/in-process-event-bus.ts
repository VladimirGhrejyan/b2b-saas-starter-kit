import type {DomainEventHandler, EventBus} from './event-bus.port'
import type {IntegrationEvent} from './integration-event'

/**
 * Maps event type strings to handler lists. Handlers run sequentially per event.
 */
export class InProcessEventBus implements EventBus {
  readonly #handlers = new Map<string, DomainEventHandler[]>()

  register(type: string, handler: DomainEventHandler): void {
    const existing = this.#handlers.get(type) ?? []

    existing.push(handler)
    this.#handlers.set(type, existing)
  }

  async dispatch(events: readonly IntegrationEvent[]): Promise<void> {
    for (const event of events) {
      const handlers = this.#handlers.get(event.type) ?? []

      for (const handler of handlers) {
        await handler(event)
      }
    }
  }
}
