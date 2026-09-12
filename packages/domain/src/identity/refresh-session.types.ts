import type {RefreshFamilyId, RefreshSessionId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type RefreshSessionReconstituteProps = {
  readonly id: RefreshSessionId
  readonly userId: UserId
  readonly familyId: RefreshFamilyId
  readonly tokenHash: string
  readonly expiresAt: Date
  readonly revokedAt?: Date
}
