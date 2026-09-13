import {Injectable} from '@nestjs/common'

import type {MembershipRepository, RoleRepository} from '@b2b-saas-starter-kit/domain'
import {PermissionCatalog, SystemRoleImmutableError} from '@b2b-saas-starter-kit/domain'

import type {UnitOfWork} from '@b2b-saas-starter-kit/platform'

import type {AuthorizationPort} from '../../shared/authorization.port'
import {RoleNotFoundError} from '../../shared/errors/role-not-found.error'
import {RoleInUseError} from '../errors/role-in-use.error'

import type {DeleteCustomRoleCommand} from './delete-custom-role.types'

/**
 * Deletes an unused custom role. Requires `authorization.roles.manage`.
 */
@Injectable()
export class DeleteCustomRoleUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly authz: AuthorizationPort,
    private readonly roles: RoleRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async execute(command: DeleteCustomRoleCommand): Promise<void> {
    await this.authz.require(command.actorId, PermissionCatalog.authorizationRolesManage, {tenantId: command.tenantId})

    return this.uow.run(async () => {
      const role = await this.roles.findById(command.roleId)

      if (role === null || role.tenantId !== command.tenantId) {
        throw new RoleNotFoundError()
      }

      if (role.isSystem) {
        throw new SystemRoleImmutableError()
      }

      const memberships = await this.memberships.findByTenant(command.tenantId)

      if (memberships.some((membership) => membership.roleIds.includes(role.id))) {
        throw new RoleInUseError()
      }

      await this.roles.delete(role.id)
      await this.authz.invalidateHoldersOf(role.id, command.tenantId)
    })
  }
}
