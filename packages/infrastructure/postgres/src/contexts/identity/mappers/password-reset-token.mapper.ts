import {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {PasswordResetToken} from '@b2b-saas-starter-kit/domain'

import {PasswordResetTokenEntity} from '../entities/password-reset-token.entity'

export const PasswordResetTokenMapper = {
  toDomain(row: PasswordResetTokenEntity): PasswordResetToken {
    return PasswordResetToken.reconstitute({
      userId: UserId.parse(row.userId),
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      consumedAt: row.consumedAt ?? undefined,
    })
  },

  toEntity(token: PasswordResetToken): PasswordResetTokenEntity {
    const row = new PasswordResetTokenEntity()

    row.userId = token.id
    row.tokenHash = token.tokenHash
    row.expiresAt = token.expiresAt
    row.consumedAt = token.consumedAt ?? null

    return row
  },
}
