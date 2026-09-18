import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {User} from '../user'

export const USER_REPOSITORY = Symbol('USER_REPOSITORY')

/**
 * Persistence port for global users. Users have no `tenantId`.
 */
export interface UserRepository {
  findById(id: UserId): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: User): Promise<void>
}
