/**
 * Snapshot/restore seam for in-memory repositories used by {@link InMemoryUnitOfWork}.
 */
export interface InMemorySnapshotable {
  snapshot(): unknown
  restore(snapshot: unknown): void
}
