import type {RoleId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {Membership, Role, RoleRepository} from '@b2b-saas-starter-kit/domain'

import {RoleNotFoundError} from '../shared/errors/role-not-found.error'

import {CannotAssignOwnerRoleError} from './errors/cannot-assign-owner-role.error'

/**
 * Owner-system-role helpers for invite, attach, and replace-roles.
 */
export class OwnerRole {
  /**
   * Finds the seeded Owner system role for `tenantId`.
   */
  static async find(roles: RoleRepository, tenantId: TenantId): Promise<Role | null> {
    const tenantRoles = await roles.findByTenant(tenantId)

    return tenantRoles.find((role) => role.isSystem && role.name === 'Owner') ?? null
  }

  /**
   * Rejects unknown role ids and the tenant Owner role id.
   */
  static async assertAssignable(roles: RoleRepository, tenantId: TenantId, roleIds: readonly RoleId[]): Promise<void> {
    const ownerRole = await OwnerRole.find(roles, tenantId)
    const found = new Map((await roles.findByIds(roleIds)).map((role) => [role.id, role]))

    for (const roleId of roleIds) {
      if (ownerRole !== null && roleId === ownerRole.id) {
        throw new CannotAssignOwnerRoleError()
      }

      const role = found.get(roleId)

      if (role === undefined || role.tenantId !== tenantId) {
        throw new RoleNotFoundError()
      }
    }
  }

  /**
   * Returns how many active memberships still hold the Owner role.
   */
  static countActive(memberships: readonly Membership[], ownerRoleId: RoleId): number {
    return memberships.filter(
      (membership) => membership.status === 'active' && membership.roleIds.includes(ownerRoleId),
    ).length
  }
}
