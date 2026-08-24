import type {MembershipId, MembershipStatus, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type ListTenantMembersQueryInput = {
  readonly tenantId: TenantId
  readonly actorId: UserId
}

export type TenantMemberListItem = {
  readonly membershipId: MembershipId
  readonly userId: UserId
  readonly roleIds: readonly RoleId[]
  readonly status: MembershipStatus
}

export type ListTenantMembersResult = {
  readonly members: readonly TenantMemberListItem[]
}
