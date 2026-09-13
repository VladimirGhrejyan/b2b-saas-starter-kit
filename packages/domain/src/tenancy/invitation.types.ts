import type {InvitationId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

/**
 * Persisted invitation state used by repository adapters. Does not record events.
 */
export type InvitationReconstituteProps = {
  readonly id: InvitationId
  readonly tenantId: TenantId
  readonly email: string
  readonly roleIds: readonly RoleId[]
  readonly tokenHash: string
  readonly expiresAt: Date
  readonly invitedByUserId: UserId
  readonly consumedAt?: Date
}
