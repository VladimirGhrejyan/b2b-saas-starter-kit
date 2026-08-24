import {AsyncLocalStorage} from 'node:async_hooks'

import type {EntityManager} from 'typeorm'

export type TransactionAlsStore = {
  readonly id: string
  readonly manager: EntityManager
}

export const transactionAls = new AsyncLocalStorage<TransactionAlsStore>()
