import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {LocalPassword} from '../local-password'

/**
 * Persistence port for local password credentials. One row per user.
 */
export interface LocalPasswordRepository {
  findByUserId(userId: UserId): Promise<LocalPassword | null>
  save(password: LocalPassword): Promise<void>
}
