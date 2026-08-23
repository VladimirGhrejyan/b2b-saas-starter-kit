import type {Permission, RoleId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {AggregateRoot} from '../shared-kernel/aggregate-root'
import {Guard} from '../shared-kernel/guard'

import {EmptyRolePermissionsError} from './errors/empty-role-permissions.error'
import {InvalidRoleNameError} from './errors/invalid-role-name.error'
import {PermissionCatalog} from './permission-catalog'
import type {RoleReconstituteProps} from './role.types'
import {SystemRoles} from './system-roles'
import type {SystemRoleName} from './system-roles.types'

/**
 * Tenant-scoped bundle of catalog permissions.
 *
 * System roles (`Owner` / `Admin` / `Member`) are seeded per tenant. `create` is
 * the seam for later custom roles.
 */
export class Role extends AggregateRoot<RoleId> {
  private constructor(
    id: RoleId,
    readonly tenantId: TenantId,
    readonly name: string,
    readonly permissions: readonly Permission[],
    readonly isSystem: boolean,
  ) {
    super(id)
  }

  /**
   * Creates a seeded system role. Permissions come from {@link SystemRoles}.
   */
  static createSystemRole(id: RoleId, tenantId: TenantId, name: SystemRoleName, occurredAt: Date): Role {
    const permissions = SystemRoles.permissionsFor(name)
    const role = new Role(id, tenantId, name, permissions, true)

    role.#recordCreated(occurredAt)

    return role
  }

  /**
   * Creates a custom (non-system) role. Permissions must be a non-empty catalog subset.
   */
  static create(
    id: RoleId,
    tenantId: TenantId,
    name: string,
    permissions: readonly Permission[],
    occurredAt: Date,
  ): Role {
    Guard.againstEmpty(name, new InvalidRoleNameError())

    const role = new Role(id, tenantId, name.trim(), Role.#normalize(permissions), false)

    role.#recordCreated(occurredAt)

    return role
  }

  /**
   * Rebuilds a role from persistence without recording events.
   */
  static reconstitute(props: RoleReconstituteProps): Role {
    return new Role(props.id, props.tenantId, props.name, Role.#normalize(props.permissions), props.isSystem)
  }

  /**
   * Returns whether this role's bundle includes `permission`.
   */
  hasPermission(permission: Permission): boolean {
    return this.permissions.includes(permission)
  }

  static #normalize(permissions: readonly Permission[]): Permission[] {
    const unique = new Set(permissions)

    if (unique.size === 0) {
      throw new EmptyRolePermissionsError()
    }

    for (const permission of unique) {
      PermissionCatalog.assertKnown(permission)
    }

    return PermissionCatalog.all.filter((permission) => unique.has(permission))
  }

  #recordCreated(occurredAt: Date): void {
    this.record({
      type: 'RoleCreated',
      occurredAt,
      roleId: this.id,
      tenantId: this.tenantId,
      name: this.name,
      isSystem: this.isSystem,
    })
  }
}
