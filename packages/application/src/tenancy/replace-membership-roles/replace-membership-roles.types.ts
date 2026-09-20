import type {MembershipId, RoleId, TenantActor, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type ReplaceMembershipRolesCommand = {
  readonly actor: TenantActor
  readonly tenantId: TenantId
  readonly membershipId: MembershipId
  readonly roleIds: readonly RoleId[]
}

export type ReplaceMembershipRolesResult = {
  readonly membershipId: MembershipId
  readonly roleIds: readonly RoleId[]
}
