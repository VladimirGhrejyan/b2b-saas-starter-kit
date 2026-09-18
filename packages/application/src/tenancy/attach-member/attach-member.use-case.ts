import {Inject, Injectable} from '@nestjs/common'

import {MembershipId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {MembershipRepository, RoleRepository, UserRepository} from '@b2b-saas-starter-kit/domain'
import {
  Membership,
  MEMBERSHIP_REPOSITORY,
  PermissionCatalog,
  ROLE_REPOSITORY,
  USER_REPOSITORY,
} from '@b2b-saas-starter-kit/domain'

import type {Clock, EventPublisher, IdGenerator, UnitOfWork} from '@b2b-saas-starter-kit/platform'
import {CLOCK, EVENT_PUBLISHER, ID_GENERATOR, UNIT_OF_WORK} from '@b2b-saas-starter-kit/platform'

import type {AuthorizationPort} from '../../shared/authorization.port'
import {AUTHORIZATION} from '../../shared/authorization.port'
import {DomainEventCollector} from '../../shared/domain-events/domain-event-collector'
import {UserNotFoundError} from '../../shared/errors/user-not-found.error'
import {MembershipAlreadyExistsError} from '../errors/membership-already-exists.error'
import {OwnerRole} from '../owner-role'

import type {AttachMemberCommand, AttachMemberResult} from './attach-member.types'

/**
 * Attaches an existing user as an active member. Does not assign the Owner role.
 */
@Injectable()
export class AttachMemberUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
    @Inject(AUTHORIZATION) private readonly authz: AuthorizationPort,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(EVENT_PUBLISHER) private readonly events: EventPublisher,
  ) {}

  async execute(command: AttachMemberCommand): Promise<AttachMemberResult> {
    await this.authz.require(command.actorId, PermissionCatalog.tenancyMembersManage, {tenantId: command.tenantId})

    return this.uow.run(async () => {
      const collector = new DomainEventCollector()
      const user = await this.users.findById(command.userId)

      if (user === null) {
        throw new UserNotFoundError()
      }

      const existing = await this.memberships.findByUserAndTenant(command.userId, command.tenantId)

      if (existing !== null) {
        throw new MembershipAlreadyExistsError()
      }

      await OwnerRole.assertAssignable(this.roles, command.tenantId, command.roleIds)

      const membership = Membership.create(
        MembershipId.parse(this.ids.generate()),
        command.tenantId,
        command.userId,
        command.roleIds,
        this.clock.now(),
      )

      await this.memberships.save(membership)
      collector.collect(membership)
      await collector.publish(this.events)
      await this.authz.invalidate(command.userId, command.tenantId)

      return {membershipId: membership.id}
    })
  }
}
