import {Inject, Injectable} from '@nestjs/common'

import {RoleId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {RoleRepository} from '@b2b-saas-starter-kit/domain'
import {PermissionCatalog, Role, ROLE_REPOSITORY} from '@b2b-saas-starter-kit/domain'

import type {Clock, EventPublisher, IdGenerator, UnitOfWork} from '@b2b-saas-starter-kit/platform'
import {CLOCK, EVENT_PUBLISHER, ID_GENERATOR, UNIT_OF_WORK} from '@b2b-saas-starter-kit/platform'

import type {AuthorizationPort} from '../../shared/authorization.port'
import {AUTHORIZATION} from '../../shared/authorization.port'
import {DomainEventCollector} from '../../shared/domain-events/domain-event-collector'
import {RoleNameTakenError} from '../errors/role-name-taken.error'

import type {CreateCustomRoleCommand, CreateCustomRoleResult} from './create-custom-role.types'

/**
 * Creates a tenant custom role. Requires `authorization.roles.manage`.
 */
@Injectable()
export class CreateCustomRoleUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
    @Inject(AUTHORIZATION) private readonly authz: AuthorizationPort,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(EVENT_PUBLISHER) private readonly events: EventPublisher,
  ) {}

  async execute(command: CreateCustomRoleCommand): Promise<CreateCustomRoleResult> {
    await this.authz.require(command.actorId, PermissionCatalog.authorizationRolesManage, {tenantId: command.tenantId})

    return this.uow.run(async () => {
      const collector = new DomainEventCollector()
      const name = command.name.trim()
      const existing = await this.roles.findByTenant(command.tenantId)

      if (existing.some((role) => role.name === name)) {
        throw new RoleNameTakenError()
      }

      const role = Role.create(
        RoleId.parse(this.ids.generate()),
        command.tenantId,
        name,
        command.permissions,
        this.clock.now(),
      )

      await this.roles.save(role)
      collector.collect(role)
      await collector.publish(this.events)

      return {
        roleId: role.id,
        name: role.name,
        permissions: role.permissions,
        isSystem: role.isSystem,
      }
    })
  }
}
