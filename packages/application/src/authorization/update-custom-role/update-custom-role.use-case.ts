import {Injectable} from '@nestjs/common'

import type {RoleRepository} from '@b2b-saas-starter-kit/domain'
import {PermissionCatalog} from '@b2b-saas-starter-kit/domain'

import type {Clock, EventPublisher, UnitOfWork} from '@b2b-saas-starter-kit/platform'

import type {AuthorizationPort} from '../../shared/authorization.port'
import {DomainEventCollector} from '../../shared/domain-events/domain-event-collector'
import {RoleNotFoundError} from '../../shared/errors/role-not-found.error'
import {RoleNameTakenError} from '../errors/role-name-taken.error'

import type {UpdateCustomRoleCommand, UpdateCustomRoleResult} from './update-custom-role.types'

/**
 * Renames and/or replaces permissions on a custom role. Requires `authorization.roles.manage`.
 */
@Injectable()
export class UpdateCustomRoleUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly authz: AuthorizationPort,
    private readonly roles: RoleRepository,
    private readonly events: EventPublisher,
  ) {}

  async execute(command: UpdateCustomRoleCommand): Promise<UpdateCustomRoleResult> {
    await this.authz.require(command.actorId, PermissionCatalog.authorizationRolesManage, {tenantId: command.tenantId})

    return this.uow.run(async () => {
      const collector = new DomainEventCollector()
      const role = await this.roles.findById(command.roleId)

      if (role === null || role.tenantId !== command.tenantId) {
        throw new RoleNotFoundError()
      }

      const now = this.clock.now()

      if (command.name !== undefined) {
        const name = command.name.trim()
        const existing = await this.roles.findByTenant(command.tenantId)

        if (existing.some((item) => item.id !== role.id && item.name === name)) {
          throw new RoleNameTakenError()
        }

        role.rename(name, now)
      }

      if (command.permissions !== undefined) {
        role.replacePermissions(command.permissions, now)
      }

      await this.roles.save(role)
      collector.collect(role)
      await collector.publish(this.events)
      await this.authz.invalidateHoldersOf(role.id, command.tenantId)

      return {
        roleId: role.id,
        name: role.name,
        permissions: role.permissions,
        isSystem: role.isSystem,
      }
    })
  }
}
