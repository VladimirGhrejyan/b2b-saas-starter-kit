import type {MembershipId, RoleId, TenantActor, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type AttachMemberCommand = {
  readonly actor: TenantActor
  readonly tenantId: TenantId
  readonly userId: UserId
  readonly roleIds: readonly RoleId[]
}

export type AttachMemberResult = {
  readonly membershipId: MembershipId
}
