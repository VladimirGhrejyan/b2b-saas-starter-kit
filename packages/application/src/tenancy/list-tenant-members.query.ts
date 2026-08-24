import {Injectable} from '@nestjs/common'

import type {MembershipRepository} from '@b2b-saas-starter-kit/domain'
import {PermissionCatalog} from '@b2b-saas-starter-kit/domain'

import type {AuthorizationPort} from '../shared/authorization.port'

import type {ListTenantMembersQueryInput, ListTenantMembersResult} from './list-tenant-members.types'

/**
 * Lists memberships for a tenant. Requires `tenancy.members.read`.
 */
@Injectable()
export class ListTenantMembersQuery {
  constructor(
    private readonly authz: AuthorizationPort,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(query: ListTenantMembersQueryInput): Promise<ListTenantMembersResult> {
    await this.authz.require(query.actorId, PermissionCatalog.tenancyMembersRead, {tenantId: query.tenantId})

    const memberships = await this.memberships.findByTenant(query.tenantId)

    return {
      members: memberships.map((membership) => ({
        membershipId: membership.id,
        userId: membership.userId,
        roleIds: membership.roleIds,
        status: membership.status,
      })),
    }
  }
}
