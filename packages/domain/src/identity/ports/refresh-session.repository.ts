import type {RefreshFamilyId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {RefreshSession} from '../refresh-session'

/**
 * Persistence port for rotating refresh sessions.
 */
export interface RefreshSessionRepository {
  findByTokenHash(tokenHash: string): Promise<RefreshSession | null>
  save(session: RefreshSession): Promise<void>
  revokeFamily(familyId: RefreshFamilyId, at: Date): Promise<void>
  revokeAllForUser(userId: UserId, at: Date): Promise<void>
}
