import type {RefreshFamilyId, RefreshSessionId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {RefreshSession, RefreshSessionRepository} from '@b2b-saas-starter-kit/domain'

import type {InMemorySnapshotable} from './in-memory-snapshotable'

/**
 * In-memory {@link RefreshSessionRepository} for application unit tests.
 */
export class InMemoryRefreshSessionRepository implements RefreshSessionRepository, InMemorySnapshotable {
  #sessions = new Map<RefreshSessionId, RefreshSession>()

  findByTokenHash(tokenHash: string): Promise<RefreshSession | null> {
    for (const session of this.#sessions.values()) {
      if (session.tokenHash === tokenHash) {
        return Promise.resolve(session)
      }
    }

    return Promise.resolve(null)
  }

  save(session: RefreshSession): Promise<void> {
    this.#sessions.set(session.id, session)

    return Promise.resolve()
  }

  async revokeFamily(familyId: RefreshFamilyId, at: Date): Promise<void> {
    for (const session of this.#sessions.values()) {
      if (session.familyId === familyId && session.revokedAt === undefined) {
        session.revoke(at)
      }
    }

    return Promise.resolve()
  }

  async revokeAllForUser(userId: UserId, at: Date): Promise<void> {
    for (const session of this.#sessions.values()) {
      if (session.userId === userId && session.revokedAt === undefined) {
        session.revoke(at)
      }
    }

    return Promise.resolve()
  }

  deleteExpiredOrRevoked(before: Date, limit: number): Promise<number> {
    const stale = [...this.#sessions.values()].filter((session) => !session.isActive(before)).slice(0, limit)

    for (const session of stale) {
      this.#sessions.delete(session.id)
    }

    return Promise.resolve(stale.length)
  }

  snapshot(): unknown {
    return new Map(this.#sessions)
  }

  restore(snapshot: unknown): void {
    this.#sessions = new Map(snapshot as Map<RefreshSessionId, RefreshSession>)
  }
}
