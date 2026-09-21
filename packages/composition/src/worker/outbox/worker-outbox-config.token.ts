export const WORKER_OUTBOX_CONFIG = Symbol('WORKER_OUTBOX_CONFIG')

export type WorkerOutboxConfig = {
  readonly pollIntervalMs: number
  readonly batchSize: number
}
