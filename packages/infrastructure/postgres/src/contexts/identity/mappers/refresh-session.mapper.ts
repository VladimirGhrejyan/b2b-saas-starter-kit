import {RefreshFamilyId, RefreshSessionId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {RefreshSession} from '@b2b-saas-starter-kit/domain'

import {RefreshSessionEntity} from '../entities/refresh-session.entity'

export const RefreshSessionMapper = {
  toDomain(row: RefreshSessionEntity): RefreshSession {
    return RefreshSession.reconstitute({
      id: RefreshSessionId.parse(row.id),
      userId: UserId.parse(row.userId),
      familyId: RefreshFamilyId.parse(row.familyId),
      tokenHash: row.tokenHash,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt ?? undefined,
    })
  },

  toEntity(session: RefreshSession): RefreshSessionEntity {
    const row = new RefreshSessionEntity()

    row.id = session.id
    row.userId = session.userId
    row.familyId = session.familyId
    row.tokenHash = session.tokenHash
    row.expiresAt = session.expiresAt
    row.revokedAt = session.revokedAt ?? null

    return row
  },
}
