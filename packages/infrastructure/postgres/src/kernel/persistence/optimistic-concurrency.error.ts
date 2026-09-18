/**
 * Thrown when a versioned aggregate save loses an optimistic concurrency check.
 */
export class OptimisticConcurrencyError extends Error {
  constructor(entityName: string, id: string) {
    super(`Optimistic concurrency conflict for ${entityName} ${id}`)

    this.name = 'OptimisticConcurrencyError'
  }
}
