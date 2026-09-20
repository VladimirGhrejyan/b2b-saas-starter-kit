import {Inject, Injectable} from '@nestjs/common'

import type {MembershipRepository, RoleRepository} from '@b2b-saas-starter-kit/domain'
import {MEMBERSHIP_REPOSITORY, PermissionCatalog, ROLE_REPOSITORY} from '@b2b-saas-starter-kit/domain'

import type {Clock, EventPublisher, UnitOfWork} from '@b2b-saas-starter-kit/platform'
import {CLOCK, EVENT_PUBLISHER, UNIT_OF_WORK} from '@b2b-saas-starter-kit/platform'

import type {AuthorizationPort} from '../../shared/authorization.port'
import {AUTHORIZATION} from '../../shared/authorization.port'
import {DomainEventCollector} from '../../shared/domain-events/domain-event-collector'
import {LastOwnerRequiredError} from '../errors/last-owner-required.error'
import {MembershipNotFoundError} from '../errors/membership-not-found.error'
import {OwnerRole} from '../owner-role'

import type {ReplaceMembershipRolesCommand, ReplaceMembershipRolesResult} from './replace-membership-roles.types'

/**
 * Replaces a membership's roles. Refuses Owner assignment and leaving zero Owners.
 */
@Injectable()
export class ReplaceMembershipRolesUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AUTHORIZATION) private readonly authz: AuthorizationPort,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(EVENT_PUBLISHER) private readonly events: EventPublisher,
  ) {}

  async execute(command: ReplaceMembershipRolesCommand): Promise<ReplaceMembershipRolesResult> {
    await this.authz.require(command.actor, PermissionCatalog.tenancyMembersManage, {tenantId: command.tenantId})

    return this.uow.run(async () => {
      const collector = new DomainEventCollector()
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
      collector.collect(membership)
      await collector.publish(this.events)
      await this.authz.invalidate(membership.userId, command.tenantId)

      return {membershipId: membership.id, roleIds: membership.roleIds}
    })
  }
}
