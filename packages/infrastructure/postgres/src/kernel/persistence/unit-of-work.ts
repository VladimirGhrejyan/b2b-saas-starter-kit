import {randomUUID} from 'node:crypto'

import {Inject, Injectable} from '@nestjs/common'
import type {DataSource} from 'typeorm'

import type {TxContext, UnitOfWork} from '@b2b-saas-starter-kit/platform'

import {DATA_SOURCE} from '../tokens'

import {transactionAls} from './transaction-als'

/**
 * TypeORM {@link UnitOfWork}. Nested `run` joins the ambient transaction (one DB tx per request).
 */
@Injectable()
export class TypeormUnitOfWork implements UnitOfWork {
  constructor(@Inject(DATA_SOURCE) private readonly dataSource: DataSource) {}

  async run<T>(work: (ctx: TxContext) => Promise<T>): Promise<T> {
    const existing = transactionAls.getStore()

    if (existing !== undefined) {
      return work({id: existing.id})
    }

    return this.dataSource.transaction(async (manager) => {
      const id = randomUUID()

      return transactionAls.run({id, manager}, () => work({id}))
    })
  }
}
