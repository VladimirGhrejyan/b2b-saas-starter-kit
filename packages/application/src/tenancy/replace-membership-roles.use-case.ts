import {Injectable} from '@nestjs/common'

import type {MembershipRepository, RoleRepository} from '@b2b-saas-starter-kit/domain'
import {PermissionCatalog} from '@b2b-saas-starter-kit/domain'

import type {Clock, UnitOfWork} from '@b2b-saas-starter-kit/platform'

import type {AuthorizationPort} from '../shared/authorization.port'

import {LastOwnerRequiredError} from './errors/last-owner-required.error'
import {MembershipNotFoundError} from './errors/membership-not-found.error'
import {OwnerRole} from './owner-role'
import type {ReplaceMembershipRolesCommand, ReplaceMembershipRolesResult} from './replace-membership-roles.types'

/**
 * Replaces a membership's roles. Refuses Owner assignment and leaving zero Owners.
 */
@Injectable()
export class ReplaceMembershipRolesUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly authz: AuthorizationPort,
    private readonly memberships: MembershipRepository,
    private readonly roles: RoleRepository,
  ) {}

  async execute(command: ReplaceMembershipRolesCommand): Promise<ReplaceMembershipRolesResult> {
    await this.authz.require(command.actorId, PermissionCatalog.tenancyMembersManage, {tenantId: command.tenantId})

    return this.uow.run(async () => {
      const membership = await this.memberships.findById(command.membershipId)

      if (membership === null || membership.tenantId !== command.tenantId) {
        throw new MembershipNotFoundError()
      }

      await OwnerRole.assertAssignable(this.roles, command.tenantId, command.roleIds)

      const ownerRole = await OwnerRole.find(this.roles, command.tenantId)

      if (ownerRole !== null && membership.roleIds.includes(ownerRole.id)) {
        const tenantMemberships = await this.memberships.findByTenant(command.tenantId)
        const remainingOwners = OwnerRole.countActive(
          tenantMemberships.filter((item) => item.id !== membership.id),
          ownerRole.id,
        )

        if (remainingOwners === 0) {
          throw new LastOwnerRequiredError()
        }
      }

      membership.replaceRoleIds(command.roleIds, this.clock.now())
      await this.memberships.save(membership)
      await this.authz.invalidate(membership.userId, command.tenantId)

      return {membershipId: membership.id, roleIds: membership.roleIds}
    })
  }
}
