import {Permission} from '@b2b-saas-starter-kit/shared-kernel-types'

import {UnknownPermissionError} from './errors/unknown-permission.error'

/**
 * Fixed, code-owned permission identifiers for the foundation.
 *
 * Checks are always against these values, never role names.
 */
export class PermissionCatalog {
  static readonly tenancyMembersRead = Permission.parse('tenancy.members.read')

  static readonly tenancyTenantRead = Permission.parse('tenancy.tenant.read')

  static readonly authorizationRolesRead = Permission.parse('authorization.roles.read')

  static readonly identityUsersRead = Permission.parse('identity.users.read')

  static readonly all: readonly Permission[] = [
    PermissionCatalog.tenancyMembersRead,
    PermissionCatalog.tenancyTenantRead,
    PermissionCatalog.authorizationRolesRead,
    PermissionCatalog.identityUsersRead,
  ]

  /**
   * Returns whether `permission` is one of the catalog constants.
   */
  static isKnown(permission: Permission): boolean {
    return PermissionCatalog.all.includes(permission)
  }

  /**
   * Throws {@link UnknownPermissionError} when `permission` is not in the catalog.
   */
  static assertKnown(permission: Permission): void {
    if (!PermissionCatalog.isKnown(permission)) {
      throw new UnknownPermissionError(permission)
    }
  }
}
