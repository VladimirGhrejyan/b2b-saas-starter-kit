import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {LocalPassword, LocalPasswordRepository} from '@b2b-saas-starter-kit/domain'

import type {InMemorySnapshotable} from './in-memory-snapshotable'

/**
 * In-memory {@link LocalPasswordRepository} for application unit tests.
 */
export class InMemoryLocalPasswordRepository implements LocalPasswordRepository, InMemorySnapshotable {
  #passwords = new Map<UserId, LocalPassword>()

  findByUserId(userId: UserId): Promise<LocalPassword | null> {
    return Promise.resolve(this.#passwords.get(userId) ?? null)
  }

  save(password: LocalPassword): Promise<void> {
    this.#passwords.set(password.id, password)

    return Promise.resolve()
  }

  snapshot(): unknown {
    return new Map(this.#passwords)
  }

  restore(snapshot: unknown): void {
    this.#passwords = new Map(snapshot as Map<UserId, LocalPassword>)
  }
}
