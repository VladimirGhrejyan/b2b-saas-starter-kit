/**
 * Thrown when {@link PostgresEventPublisher} is called without an ambient UnitOfWork transaction.
 */
export class EventPublisherOutsideTransactionError extends Error {
  constructor() {
    super('EventPublisher.publish must run inside an active UnitOfWork transaction')
    this.name = 'EventPublisherOutsideTransactionError'
  }
}
