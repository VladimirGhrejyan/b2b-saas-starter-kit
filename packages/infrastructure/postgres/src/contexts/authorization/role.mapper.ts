import {Permission, RoleId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Role} from '@b2b-saas-starter-kit/domain'

import {RoleEntity} from './role.entity'
import {RolePermissionEntity} from './role-permission.entity'

export const RoleMapper = {
  toDomain(row: RoleEntity): Role {
    return Role.reconstitute({
      id: RoleId.parse(row.id),
      tenantId: TenantId.parse(row.tenantId),
      name: row.name,
      permissions: row.permissions.map((permissionRow) => Permission.parse(permissionRow.permission)),
      isSystem: row.isSystem,
    })
  },

  toEntity(role: Role): RoleEntity {
    const row = new RoleEntity()

    row.id = role.id
    row.tenantId = role.tenantId
    row.name = role.name
    row.isSystem = role.isSystem
    row.permissions = role.permissions.map((permission) => {
      const permissionRow = new RolePermissionEntity()

      permissionRow.roleId = role.id
      permissionRow.permission = permission

      return permissionRow
    })

    return row
  },
}
