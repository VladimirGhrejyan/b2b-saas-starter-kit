import type {TxContext} from './tx-context'

/**
 * Transaction boundary. Use cases call `run`; repositories do not receive
 * `TxContext` on their port signatures.
 */
export interface UnitOfWork {
  run<T>(work: (ctx: TxContext) => Promise<T>): Promise<T>
}
