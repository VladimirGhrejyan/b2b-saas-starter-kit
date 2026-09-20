import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {PasswordResetToken} from '../password-reset-token'

export const PASSWORD_RESET_TOKEN_REPOSITORY = Symbol('PASSWORD_RESET_TOKEN_REPOSITORY')

/**
 * Persistence port for password-reset tokens. One outstanding token per user.
 */
export interface PasswordResetTokenRepository {
  findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>
  findByUserId(userId: UserId): Promise<PasswordResetToken | null>
  save(token: PasswordResetToken): Promise<void>
  deleteInactive(before: Date, limit: number): Promise<number>
}
