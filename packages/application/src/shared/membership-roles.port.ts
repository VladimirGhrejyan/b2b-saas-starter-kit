import type {RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export const MEMBERSHIP_ROLES = Symbol('MEMBERSHIP_ROLES')

/**
 * Sanctioned tenancy read for authorization: role ids on an active membership.
 */
export interface MembershipRolesPort {
  roleIdsFor(userId: UserId, tenantId: TenantId): Promise<readonly RoleId[]>
}
