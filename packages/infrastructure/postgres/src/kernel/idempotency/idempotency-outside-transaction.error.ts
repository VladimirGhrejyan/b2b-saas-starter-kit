/**
 * Thrown when {@link PostgresIdempotencyStore} is called without an ambient UnitOfWork transaction.
 */
export class IdempotencyOutsideTransactionError extends Error {
  constructor() {
    super('IdempotencyPort must run inside an active UnitOfWork transaction')
    this.name = 'IdempotencyOutsideTransactionError'
  }
}
