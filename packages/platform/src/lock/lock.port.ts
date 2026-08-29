import type {LockLease} from './lock.types'

/**
 * Distributed lock. `release` must use the lease token so a timed-out holder
 * cannot unlock a later owner.
 */
export interface LockPort {
  acquire(key: string, ttlSeconds: number): Promise<LockLease | null>
  release(lease: LockLease): Promise<void>
}
