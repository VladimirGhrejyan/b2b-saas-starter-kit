import type {MembershipId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type CreateTenantCommand = {
  readonly name: string
  readonly ownerUserId: UserId
}

export type CreateTenantResult = {
  readonly tenantId: TenantId
  readonly ownerMembershipId: MembershipId
  readonly roleIds: {
    readonly owner: RoleId
    readonly admin: RoleId
    readonly member: RoleId
  }
}
