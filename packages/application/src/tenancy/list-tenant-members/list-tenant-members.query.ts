import {Inject, Injectable} from '@nestjs/common'

import type {MembershipRepository, UserRepository} from '@b2b-saas-starter-kit/domain'
import {MEMBERSHIP_REPOSITORY, PermissionCatalog, USER_REPOSITORY} from '@b2b-saas-starter-kit/domain'

import type {AuthorizationPort} from '../../shared/authorization.port'
import {AUTHORIZATION} from '../../shared/authorization.port'

import type {ListTenantMembersQueryInput, ListTenantMembersResult} from './list-tenant-members.types'

/**
 * Lists memberships for a tenant. Requires `tenancy.members.read`.
 *
 * Includes optional user PII when the actor also has `identity.users.read`.
 */
@Injectable()
export class ListTenantMembersQuery {
  constructor(
    @Inject(AUTHORIZATION) private readonly authz: AuthorizationPort,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async execute(query: ListTenantMembersQueryInput): Promise<ListTenantMembersResult> {
    await this.authz.require(query.actorId, PermissionCatalog.tenancyMembersRead, {tenantId: query.tenantId})

    const [memberships, permissions] = await Promise.all([
      this.memberships.findByTenant(query.tenantId),
      this.authz.getEffectivePermissions(query.actorId, query.tenantId),
    ])
    const includeUser = permissions.includes(PermissionCatalog.identityUsersRead)

    const members = await Promise.all(
      memberships.map(async (membership) => {
        const item = {
          membershipId: membership.id,
          userId: membership.userId,
          roleIds: membership.roleIds,
          status: membership.status,
        }

        if (!includeUser) {
          return item
        }

        const user = await this.users.findById(membership.userId)

        if (user === null) {
          return item
        }

        return {
          ...item,
          user: {email: user.email, displayName: user.displayName},
        }
      }),
    )

    return {members}
  }
}
