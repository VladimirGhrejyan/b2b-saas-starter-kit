/**
 * Opaque correlation token for the active unit of work.
 *
 * Adapters must not put `EntityManager` or other persistence types on this
 * surface. Repositories join the ambient transaction inside the adapter.
 */
export type TxContext = {
  readonly id: string
}
