import {Inject, Injectable} from '@nestjs/common'

import {MembershipId, RoleId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {MembershipRepository, RoleRepository, TenantRepository, UserRepository} from '@b2b-saas-starter-kit/domain'
import {
  Membership,
  MEMBERSHIP_REPOSITORY,
  Role,
  ROLE_REPOSITORY,
  SystemRoleNames,
  Tenant,
  TENANT_REPOSITORY,
  USER_REPOSITORY,
} from '@b2b-saas-starter-kit/domain'

import type {Clock, EventPublisher, IdGenerator, UnitOfWork} from '@b2b-saas-starter-kit/platform'
import {CLOCK, EVENT_PUBLISHER, ID_GENERATOR, UNIT_OF_WORK} from '@b2b-saas-starter-kit/platform'

import {DomainEventCollector} from '../../shared/domain-events/domain-event-collector'
import {OwnerUserNotFoundError} from '../errors/owner-user-not-found.error'

import type {CreateTenantCommand, CreateTenantResult} from './create-tenant.types'

/**
 * Creates a tenant, seeds Owner/Admin/Member roles, and attaches the owner membership.
 */
@Injectable()
export class CreateTenantUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(TENANT_REPOSITORY) private readonly tenants: TenantRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    @Inject(EVENT_PUBLISHER) private readonly events: EventPublisher,
  ) {}

  async execute(command: CreateTenantCommand): Promise<CreateTenantResult> {
    return this.uow.run(async () => {
      const collector = new DomainEventCollector()
      const owner = await this.users.findById(command.ownerUserId)

      if (owner === null) {
        throw new OwnerUserNotFoundError()
      }

      const occurredAt = this.clock.now()
      const tenant = Tenant.create(TenantId.parse(this.ids.generate()), command.name, occurredAt)

      await this.tenants.save(tenant)
      collector.collect(tenant)

      const seededRoles = SystemRoleNames.map((name) =>
        Role.createSystemRole(RoleId.parse(this.ids.generate()), tenant.id, name, occurredAt),
      )

      await this.roles.saveMany(seededRoles)
      collector.collect(...seededRoles)

      const ownerRole = seededRoles.find((role) => role.name === 'Owner')
      const adminRole = seededRoles.find((role) => role.name === 'Admin')
      const memberRole = seededRoles.find((role) => role.name === 'Member')

      if (ownerRole === undefined || adminRole === undefined || memberRole === undefined) {
        throw new Error('CreateTenant must seed Owner, Admin, and Member')
      }

      const membership = Membership.createOwner(
        MembershipId.parse(this.ids.generate()),
        tenant.id,
        command.ownerUserId,
        ownerRole.id,
        occurredAt,
      )

      await this.memberships.save(membership)
      collector.collect(membership)
      await collector.publish(this.events)

      return {
        tenantId: tenant.id,
        ownerMembershipId: membership.id,
        roleIds: {
          owner: ownerRole.id,
          admin: adminRole.id,
          member: memberRole.id,
        },
      }
    })
  }
}
