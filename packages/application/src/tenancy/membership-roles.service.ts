import {Injectable} from '@nestjs/common'

import type {RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {MembershipRepository} from '@b2b-saas-starter-kit/domain'

import type {MembershipRolesPort} from '../shared/membership-roles.port'

/**
 * Active-membership role ids for {@link AuthorizationPort}.
 */
@Injectable()
export class MembershipRolesService implements MembershipRolesPort {
  constructor(private readonly memberships: MembershipRepository) {}

  async roleIdsFor(userId: UserId, tenantId: TenantId): Promise<readonly RoleId[]> {
    const membership = await this.memberships.findByUserAndTenant(userId, tenantId)

    if (membership === null || membership.status !== 'active') {
      return []
    }

    return membership.roleIds
  }
}
