import type {
  MembershipId,
  MembershipStatus,
  RoleId,
  TenantActor,
  TenantId,
  UserId,
} from '@b2b-saas-starter-kit/shared-kernel-types'

export type ListTenantMembersQueryInput = {
  readonly tenantId: TenantId
  readonly actor: TenantActor
}

export type TenantMemberUser = {
  readonly email: string
  readonly displayName: string
}

export type TenantMemberListItem = {
  readonly membershipId: MembershipId
  readonly userId: UserId
  readonly roleIds: readonly RoleId[]
  readonly status: MembershipStatus
  readonly user?: TenantMemberUser
}

export type ListTenantMembersResult = {
  readonly members: readonly TenantMemberListItem[]
}
