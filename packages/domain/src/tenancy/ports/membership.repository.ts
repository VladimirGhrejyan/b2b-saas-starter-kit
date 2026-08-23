import type {MembershipId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {Membership} from '../membership'

/**
 * Persistence port for memberships. Cross-context links are branded IDs only.
 */
export interface MembershipRepository {
  findById(id: MembershipId): Promise<Membership | null>
  findByTenant(tenantId: TenantId): Promise<Membership[]>
  findByUserAndTenant(userId: UserId, tenantId: TenantId): Promise<Membership | null>
  save(membership: Membership): Promise<void>
}
