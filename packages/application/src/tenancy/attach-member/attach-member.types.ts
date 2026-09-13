import type {MembershipId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type AttachMemberCommand = {
  readonly actorId: UserId
  readonly tenantId: TenantId
  readonly userId: UserId
  readonly roleIds: readonly RoleId[]
}

export type AttachMemberResult = {
  readonly membershipId: MembershipId
}
