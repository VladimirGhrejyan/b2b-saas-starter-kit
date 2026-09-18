/**
 * Thrown when a multi-statement write runs outside an ambient UnitOfWork transaction.
 */
export class AmbientTransactionRequiredError extends Error {
  constructor() {
    super('Multi-statement persistence requires an ambient UnitOfWork transaction')

    this.name = 'AmbientTransactionRequiredError'
  }
}
