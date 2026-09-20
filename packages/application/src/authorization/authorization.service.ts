import {Inject, Injectable} from '@nestjs/common'

import type {
  ApiKeyId,
  Permission,
  RoleId,
  TenantActor,
  TenantId,
  UserId,
} from '@b2b-saas-starter-kit/shared-kernel-types'
import {TenantActorKind} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {MembershipRepository, RoleRepository} from '@b2b-saas-starter-kit/domain'
import {MEMBERSHIP_REPOSITORY, ROLE_REPOSITORY} from '@b2b-saas-starter-kit/domain'

import type {CachePort} from '@b2b-saas-starter-kit/platform'
import {CACHE} from '@b2b-saas-starter-kit/platform'

import type {ApiKeyPermissionsPort} from '../shared/api-key-permissions.port'
import {API_KEY_PERMISSIONS} from '../shared/api-key-permissions.port'
import type {AuthorizationPort} from '../shared/authorization.port'
import {InsufficientPermissionError} from '../shared/errors/insufficient-permission.error'
import type {MembershipRolesPort} from '../shared/membership-roles.port'
import {MEMBERSHIP_ROLES} from '../shared/membership-roles.port'

import {apiKeyPermissionsCacheKey} from './api-key-permissions-cache-key'
import {EFFECTIVE_PERMISSIONS_TTL_SECONDS} from './authorization.constants'
import {effectivePermissionsCacheKey} from './effective-permissions-cache-key'

/**
 * Resolves effective permissions from tenant roles + membership role ids, or from
 * an API key's minted permission subset.
 *
 * Cache-aside via {@link CachePort}. Membership and role writes `del`
 * {@link effectivePermissionsCacheKey} for the affected user+tenant. Key
 * permission edits `del` {@link apiKeyPermissionsCacheKey}.
 */
@Injectable()
export class AuthorizationService implements AuthorizationPort {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(MEMBERSHIP_ROLES) private readonly membershipRoles: MembershipRolesPort,
    @Inject(CACHE) private readonly cache: CachePort,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    @Inject(API_KEY_PERMISSIONS) private readonly apiKeyPermissions: ApiKeyPermissionsPort,
  ) {}

  async require(actor: TenantActor, permission: Permission, scope: {tenantId: TenantId}): Promise<void> {
    const effective = await this.getPermissions(actor, scope.tenantId)

    if (!effective.includes(permission)) {
      throw new InsufficientPermissionError(permission)
    }
  }

  async getPermissions(actor: TenantActor, tenantId: TenantId): Promise<readonly Permission[]> {
    return actor.kind === TenantActorKind.user
      ? this.getEffectivePermissions(actor.id, tenantId)
      : this.getApiKeyPermissions(actor.id, tenantId)
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

  async invalidate(userId: UserId, tenantId: TenantId): Promise<void> {
    await this.cache.del(effectivePermissionsCacheKey(tenantId, userId))
  }

  async invalidateHoldersOf(roleId: RoleId, tenantId: TenantId): Promise<void> {
    const memberships = await this.memberships.findByTenantAndRole(tenantId, roleId)

    await Promise.all(memberships.map((membership) => this.invalidate(membership.userId, tenantId)))
  }

  async invalidateApiKey(apiKeyId: ApiKeyId, tenantId: TenantId): Promise<void> {
    await this.cache.del(apiKeyPermissionsCacheKey(tenantId, apiKeyId))
  }

  private async getApiKeyPermissions(apiKeyId: ApiKeyId, tenantId: TenantId): Promise<readonly Permission[]> {
    const key = apiKeyPermissionsCacheKey(tenantId, apiKeyId)
    const cached = await this.cache.get<Permission[]>(key)

    if (cached !== null) {
      return cached
    }

    const permissions = [...(await this.apiKeyPermissions.permissionsFor(apiKeyId))]

    await this.cache.set(key, permissions, EFFECTIVE_PERMISSIONS_TTL_SECONDS)

    return permissions
  }

  private async resolvePermissions(userId: UserId, tenantId: TenantId): Promise<Permission[]> {
    const roleIds = await this.membershipRoles.roleIdsFor(userId, tenantId)
    const permissions = new Set<Permission>()

    for (const role of await this.roles.findByIds(roleIds)) {
      if (role.tenantId !== tenantId) {
        continue
      }

      for (const permission of role.permissions) {
        permissions.add(permission)
      }
    }

    return [...permissions]
  }
}
