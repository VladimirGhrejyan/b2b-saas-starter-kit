import {Inject, Injectable} from '@nestjs/common'

import type {RoleRepository} from '@b2b-saas-starter-kit/domain'
import {PermissionCatalog, ROLE_REPOSITORY} from '@b2b-saas-starter-kit/domain'

import type {AuthorizationPort} from '../../shared/authorization.port'
import {AUTHORIZATION} from '../../shared/authorization.port'

import type {ListRolesQueryInput, ListRolesResult} from './list-roles.types'

/**
 * Lists tenant roles. Requires `authorization.roles.read`.
 */
@Injectable()
export class ListRolesQuery {
  constructor(
    @Inject(AUTHORIZATION) private readonly authz: AuthorizationPort,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
  ) {}

  async execute(query: ListRolesQueryInput): Promise<ListRolesResult> {
    await this.authz.require(query.actor, PermissionCatalog.authorizationRolesRead, {tenantId: query.tenantId})

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
