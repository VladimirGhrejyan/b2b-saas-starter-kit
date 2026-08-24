import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {User, UserRepository} from '@b2b-saas-starter-kit/domain'

import type {InMemorySnapshotable} from './in-memory-snapshotable'

/**
 * In-memory {@link UserRepository} for application unit tests.
 */
export class InMemoryUserRepository implements UserRepository, InMemorySnapshotable {
  #users = new Map<UserId, User>()

  findById(id: UserId): Promise<User | null> {
    return Promise.resolve(this.#users.get(id) ?? null)
  }

  findByEmail(email: string): Promise<User | null> {
    const normalized = email.trim().toLowerCase()

    for (const user of this.#users.values()) {
      if (user.email === normalized) {
        return Promise.resolve(user)
      }
    }

    return Promise.resolve(null)
  }

  save(user: User): Promise<void> {
    this.#users.set(user.id, user)

    return Promise.resolve()
  }

  snapshot(): unknown {
    return new Map(this.#users)
  }

  restore(snapshot: unknown): void {
    this.#users = new Map(snapshot as Map<UserId, User>)
  }
}
