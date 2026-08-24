import type {TxContext, UnitOfWork} from '@b2b-saas-starter-kit/platform'

import type {InMemorySnapshotable} from './in-memory-snapshotable'

/**
 * In-memory {@link UnitOfWork} that restores registered stores when `work` throws.
 */
export class InMemoryUnitOfWork implements UnitOfWork {
  readonly #stores: readonly InMemorySnapshotable[]

  constructor(...stores: InMemorySnapshotable[]) {
    this.#stores = stores
  }

  async run<T>(work: (ctx: TxContext) => Promise<T>): Promise<T> {
    const snapshots = this.#stores.map((store) => store.snapshot())

    try {
      return await work({id: 'in-memory'})
    } catch (error) {
      let index = 0

      for (const store of this.#stores) {
        store.restore(snapshots[index])
        index += 1
      }

      throw error
    }
  }
}
