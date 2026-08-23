import type {UserId, UserStatus} from '@b2b-saas-starter-kit/shared-kernel-types'

/**
 * Persisted user state used by repository adapters. Does not record events.
 */
export type UserReconstituteProps = {
  readonly id: UserId
  readonly email: string
  readonly displayName: string
  readonly status: UserStatus
}
