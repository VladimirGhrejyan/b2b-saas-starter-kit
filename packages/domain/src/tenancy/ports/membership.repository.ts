import type {MembershipId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {Membership} from '../membership'

export const MEMBERSHIP_REPOSITORY = Symbol('MEMBERSHIP_REPOSITORY')

/**
 * Persistence port for memberships. Cross-context links are branded IDs only.
 */
export interface MembershipRepository {
  findById(id: MembershipId): Promise<Membership | null>
  findByTenant(tenantId: TenantId): Promise<Membership[]>
  findByTenantAndRole(tenantId: TenantId, roleId: RoleId): Promise<Membership[]>
  findByUser(userId: UserId): Promise<Membership[]>
  findByUserAndTenant(userId: UserId, tenantId: TenantId): Promise<Membership | null>
  save(membership: Membership): Promise<void>
}
