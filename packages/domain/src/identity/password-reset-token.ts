import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Entity} from '../shared-kernel/entity'

import type {PasswordResetTokenReconstituteProps} from './password-reset-token.types'

/**
 * One outstanding password-reset token per user. The raw token is never stored.
 */
export class PasswordResetToken extends Entity<UserId> {
  readonly tokenHash: string

  readonly expiresAt: Date

  #consumedAt: Date | undefined

  private constructor(userId: UserId, tokenHash: string, expiresAt: Date, consumedAt: Date | undefined) {
    super(userId)
    this.tokenHash = tokenHash
    this.expiresAt = expiresAt
    this.#consumedAt = consumedAt
  }

  get consumedAt(): Date | undefined {
    return this.#consumedAt
  }

  static create(userId: UserId, tokenHash: string, expiresAt: Date): PasswordResetToken {
    return new PasswordResetToken(userId, tokenHash, expiresAt, undefined)
  }

  static reconstitute(props: PasswordResetTokenReconstituteProps): PasswordResetToken {
    return new PasswordResetToken(props.userId, props.tokenHash, props.expiresAt, props.consumedAt)
  }

  consume(at: Date): void {
    this.#consumedAt = at
  }

  isActive(now: Date): boolean {
    return this.#consumedAt === undefined && this.expiresAt.getTime() > now.getTime()
  }
}
