import type {EntityManager} from 'typeorm'

import {AmbientTransactionRequiredError} from './ambient-transaction-required.error'
import {transactionAls} from './transaction-als'

/**
 * Guards multi-statement repository writes that require an ambient UnitOfWork transaction.
 */
export class AssertAmbientTransaction {
  static assert(): void {
    if (transactionAls.getStore() === undefined) {
      throw new AmbientTransactionRequiredError()
    }
  }

  static requireManager(): EntityManager {
    AssertAmbientTransaction.assert()

    const store = transactionAls.getStore()

    if (store === undefined) {
      throw new AmbientTransactionRequiredError()
    }

    return store.manager
  }
}
