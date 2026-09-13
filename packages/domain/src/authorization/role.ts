import type {Permission, RoleId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {AggregateRoot} from '../shared-kernel/aggregate-root'
import {Guard} from '../shared-kernel/guard'

import {EmptyRolePermissionsError} from './errors/empty-role-permissions.error'
import {InvalidRoleNameError} from './errors/invalid-role-name.error'
import {ReservedRoleNameError} from './errors/reserved-role-name.error'
import {SystemRoleImmutableError} from './errors/system-role-immutable.error'
import {PermissionCatalog} from './permission-catalog'
import type {RoleReconstituteProps} from './role.types'
import {SystemRoles} from './system-roles'
import {type SystemRoleName, SystemRoleNames} from './system-roles.types'

/**
 * Tenant-scoped bundle of catalog permissions.
 *
 * System roles (`Owner` / `Admin` / `Member`) are seeded per tenant. `create` is
 * the seam for custom roles.
 */
export class Role extends AggregateRoot<RoleId> {
  readonly tenantId: TenantId

  readonly isSystem: boolean

  #name: string

  #permissions: readonly Permission[]

  private constructor(
    id: RoleId,
    tenantId: TenantId,
    name: string,
    permissions: readonly Permission[],
    isSystem: boolean,
  ) {
    super(id)
    this.tenantId = tenantId
    this.#name = name
    this.#permissions = permissions
    this.isSystem = isSystem
  }

  get name(): string {
    return this.#name
  }

  get permissions(): readonly Permission[] {
    return this.#permissions
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
    const normalizedName = Role.#normalizeName(name)
    const role = new Role(id, tenantId, normalizedName, Role.#normalize(permissions), false)

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
   * Renames a custom role. System roles cannot be renamed.
   */
  rename(name: string, occurredAt: Date): void {
    this.#assertMutable()
    this.#name = Role.#normalizeName(name)

    this.record({
      type: 'RoleRenamed',
      occurredAt,
      roleId: this.id,
      tenantId: this.tenantId,
      name: this.#name,
    })
  }

  /**
   * Replaces a custom role's permission bundle. System roles cannot be changed.
   */
  replacePermissions(permissions: readonly Permission[], occurredAt: Date): void {
    this.#assertMutable()
    this.#permissions = Role.#normalize(permissions)

    this.record({
      type: 'RolePermissionsReplaced',
      occurredAt,
      roleId: this.id,
      tenantId: this.tenantId,
    })
  }

  /**
   * Returns whether this role's bundle includes `permission`.
   */
  hasPermission(permission: Permission): boolean {
    return this.#permissions.includes(permission)
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

  static #normalizeName(name: string): string {
    Guard.againstEmpty(name, new InvalidRoleNameError())

    const trimmed = name.trim()

    if (SystemRoleNames.includes(trimmed as SystemRoleName)) {
      throw new ReservedRoleNameError()
    }

    return trimmed
  }

  #assertMutable(): void {
    if (this.isSystem) {
      throw new SystemRoleImmutableError()
    }
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
