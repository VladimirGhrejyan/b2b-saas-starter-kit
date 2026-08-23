import type {MembershipId, MembershipStatus, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

/**
 * Persisted membership state used by repository adapters. Does not record events.
 */
export type MembershipReconstituteProps = {
  readonly id: MembershipId
  readonly tenantId: TenantId
  readonly userId: UserId
  readonly roleIds: readonly RoleId[]
  readonly status: MembershipStatus
}
