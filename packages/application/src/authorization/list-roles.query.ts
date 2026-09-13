import {Injectable} from '@nestjs/common'

import type {RoleRepository} from '@b2b-saas-starter-kit/domain'
import {PermissionCatalog} from '@b2b-saas-starter-kit/domain'

import type {AuthorizationPort} from '../shared/authorization.port'

import type {ListRolesQueryInput, ListRolesResult} from './list-roles.types'

/**
 * Lists tenant roles. Requires `authorization.roles.read`.
 */
@Injectable()
export class ListRolesQuery {
  constructor(
    private readonly authz: AuthorizationPort,
    private readonly roles: RoleRepository,
  ) {}

  async execute(query: ListRolesQueryInput): Promise<ListRolesResult> {
    await this.authz.require(query.actorId, PermissionCatalog.authorizationRolesRead, {tenantId: query.tenantId})

    const roles = await this.roles.findByTenant(query.tenantId)

    return {
      roles: roles.map((role) => ({
        roleId: role.id,
        name: role.name,
        permissions: role.permissions,
        isSystem: role.isSystem,
      })),
    }
  }
}
