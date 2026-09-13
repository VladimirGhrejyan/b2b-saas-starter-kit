import {Injectable} from '@nestjs/common'

import {RoleId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {RoleRepository} from '@b2b-saas-starter-kit/domain'
import {PermissionCatalog, Role} from '@b2b-saas-starter-kit/domain'

import type {Clock, IdGenerator, UnitOfWork} from '@b2b-saas-starter-kit/platform'

import type {AuthorizationPort} from '../shared/authorization.port'

import {RoleNameTakenError} from './errors/role-name-taken.error'
import type {CreateCustomRoleCommand, CreateCustomRoleResult} from './create-custom-role.types'

/**
 * Creates a tenant custom role. Requires `authorization.roles.manage`.
 */
@Injectable()
export class CreateCustomRoleUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly authz: AuthorizationPort,
    private readonly roles: RoleRepository,
  ) {}

  async execute(command: CreateCustomRoleCommand): Promise<CreateCustomRoleResult> {
    await this.authz.require(command.actorId, PermissionCatalog.authorizationRolesManage, {tenantId: command.tenantId})

    return this.uow.run(async () => {
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

      return {
        roleId: role.id,
        name: role.name,
        permissions: role.permissions,
        isSystem: role.isSystem,
      }
    })
  }
}
