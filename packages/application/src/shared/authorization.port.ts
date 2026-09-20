import type {
  ApiKeyId,
  Permission,
  RoleId,
  TenantActor,
  TenantId,
  UserId,
} from '@b2b-saas-starter-kit/shared-kernel-types'

export const AUTHORIZATION = Symbol('AUTHORIZATION')

/**
 * Published authorization questions. Implementation composes {@link RoleRepository}
 * and {@link MembershipRolesPort} / {@link ApiKeyPermissionsPort} — never a cross-context join.
 */
export interface AuthorizationPort {
  require(actor: TenantActor, permission: Permission, scope: {tenantId: TenantId}): Promise<void>
  getPermissions(actor: TenantActor, tenantId: TenantId): Promise<readonly Permission[]>
  getEffectivePermissions(userId: UserId, tenantId: TenantId): Promise<readonly Permission[]>
  invalidate(userId: UserId, tenantId: TenantId): Promise<void>
  invalidateHoldersOf(roleId: RoleId, tenantId: TenantId): Promise<void>
  invalidateApiKey(apiKeyId: ApiKeyId, tenantId: TenantId): Promise<void>
}
