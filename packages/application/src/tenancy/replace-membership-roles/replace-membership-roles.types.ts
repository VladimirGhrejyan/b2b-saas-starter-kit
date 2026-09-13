import type {MembershipId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type ReplaceMembershipRolesCommand = {
  readonly actorId: UserId
  readonly tenantId: TenantId
  readonly membershipId: MembershipId
  readonly roleIds: readonly RoleId[]
}

export type ReplaceMembershipRolesResult = {
  readonly membershipId: MembershipId
  readonly roleIds: readonly RoleId[]
}
