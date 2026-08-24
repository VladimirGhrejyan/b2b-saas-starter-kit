import type {
  MembershipId,
  MembershipStatus,
  Permission,
  RoleId,
  TenantId,
  UserId,
  UserStatus,
} from '@b2b-saas-starter-kit/shared-kernel-types'

export type GetMyProfileQueryInput = {
  readonly actorId: UserId
  readonly tenantId: TenantId
}

export type GetMyProfileMembership = {
  readonly membershipId: MembershipId
  readonly tenantId: TenantId
  readonly roleIds: readonly RoleId[]
  readonly status: MembershipStatus
}

export type GetMyProfileResult = {
  readonly user: {
    readonly id: UserId
    readonly email: string
    readonly displayName: string
    readonly status: UserStatus
  }
  readonly membership: GetMyProfileMembership | null
  readonly effectivePermissions: readonly Permission[]
}
