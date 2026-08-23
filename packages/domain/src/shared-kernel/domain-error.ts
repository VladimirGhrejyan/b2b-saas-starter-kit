/**
 * Base error for domain invariant violations.
 *
 * Throw subclasses from aggregates. `code` is a stable machine identifier for
 * HTTP mapping at the edge; `message` is for logs and developers.
 */
export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = new.target.name
  }
}
