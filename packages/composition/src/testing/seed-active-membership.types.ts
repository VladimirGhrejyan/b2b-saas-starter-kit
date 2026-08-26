import type {MembershipId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type SeedActiveMembershipInput = {
  readonly userId: UserId
  readonly tenantId: TenantId
  readonly roleId: RoleId
}

export type SeedActiveMembershipResult = {
  readonly membershipId: MembershipId
}
