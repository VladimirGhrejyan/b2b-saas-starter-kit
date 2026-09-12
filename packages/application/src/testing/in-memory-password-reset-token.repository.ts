import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {PasswordResetToken, PasswordResetTokenRepository} from '@b2b-saas-starter-kit/domain'

import type {InMemorySnapshotable} from './in-memory-snapshotable'

/**
 * In-memory {@link PasswordResetTokenRepository} for application unit tests.
 */
export class InMemoryPasswordResetTokenRepository implements PasswordResetTokenRepository, InMemorySnapshotable {
  #tokens = new Map<UserId, PasswordResetToken>()

  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null> {
    for (const token of this.#tokens.values()) {
      if (token.tokenHash === tokenHash) {
        return Promise.resolve(token)
      }
    }

    return Promise.resolve(null)
  }

  findByUserId(userId: UserId): Promise<PasswordResetToken | null> {
    return Promise.resolve(this.#tokens.get(userId) ?? null)
  }

  save(token: PasswordResetToken): Promise<void> {
    this.#tokens.set(token.id, token)

    return Promise.resolve()
  }

  snapshot(): unknown {
    return new Map(this.#tokens)
  }

  restore(snapshot: unknown): void {
    this.#tokens = new Map(snapshot as Map<UserId, PasswordResetToken>)
  }
}
