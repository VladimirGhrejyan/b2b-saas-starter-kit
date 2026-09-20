import type {Permission} from '@b2b-saas-starter-kit/shared-kernel-types'

import {PermissionCatalog} from './permission-catalog'
import type {SystemRoleName} from './system-roles.types'

/**
 * Permission bundles for the three seeded system roles.
 *
 * Owner = entire catalog. Admin = members + tenant + users + api keys (no roles.read / roles.manage).
 * Member = tenant read only.
 */
export class SystemRoles {
  /**
   * Returns the catalog permissions bundled by `name`.
   */
  static permissionsFor(name: SystemRoleName): readonly Permission[] {
    switch (name) {
      case 'Owner': {
        return PermissionCatalog.all
      }

      case 'Admin': {
        return [
          PermissionCatalog.tenancyMembersRead,
          PermissionCatalog.tenancyMembersInvite,
          PermissionCatalog.tenancyMembersManage,
          PermissionCatalog.tenancyTenantRead,
          PermissionCatalog.identityUsersRead,
          PermissionCatalog.identityApiKeysManage,
        ]
      }

      case 'Member': {
        return [PermissionCatalog.tenancyTenantRead]
      }
    }
  }
}
