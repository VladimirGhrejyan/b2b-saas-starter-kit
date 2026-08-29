import {Injectable} from '@nestjs/common'

import type {Permission, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {RoleRepository} from '@b2b-saas-starter-kit/domain'

import type {CachePort} from '@b2b-saas-starter-kit/platform'

import type {AuthorizationPort} from '../shared/authorization.port'
import {InsufficientPermissionError} from '../shared/errors/insufficient-permission.error'
import type {MembershipRolesPort} from '../shared/membership-roles.port'

import {EFFECTIVE_PERMISSIONS_TTL_SECONDS} from './authorization.constants'
import {effectivePermissionsCacheKey} from './effective-permissions-cache-key'

/**
 * Resolves effective permissions from tenant roles + membership role ids.
 *
 * Cache-aside via {@link CachePort}. Future role/membership writes must `del`
 * {@link effectivePermissionsCacheKey} for the affected user+tenant.
 */
@Injectable()
export class AuthorizationService implements AuthorizationPort {
  constructor(
    private readonly roles: RoleRepository,
    private readonly membershipRoles: MembershipRolesPort,
    private readonly cache: CachePort,
  ) {}

  async require(actorId: UserId, permission: Permission, scope: {tenantId: TenantId}): Promise<void> {
    const effective = await this.getEffectivePermissions(actorId, scope.tenantId)

    if (!effective.includes(permission)) {
      throw new InsufficientPermissionError(permission)
    }
  }

  async getEffectivePermissions(userId: UserId, tenantId: TenantId): Promise<readonly Permission[]> {
    const key = effectivePermissionsCacheKey(tenantId, userId)
    const cached = await this.cache.get<Permission[]>(key)

    if (cached !== null) {
      return cached
    }

    const permissions = await this.resolvePermissions(userId, tenantId)

    await this.cache.set(key, permissions, EFFECTIVE_PERMISSIONS_TTL_SECONDS)

    return permissions
  }

  private async resolvePermissions(userId: UserId, tenantId: TenantId): Promise<Permission[]> {
    const roleIds = await this.membershipRoles.roleIdsFor(userId, tenantId)
    const permissions = new Set<Permission>()

    for (const roleId of roleIds) {
      const role = await this.roles.findById(roleId)

      if (role === null || role.tenantId !== tenantId) {
        continue
      }

      for (const permission of role.permissions) {
        permissions.add(permission)
      }
    }

    return [...permissions]
  }
}
