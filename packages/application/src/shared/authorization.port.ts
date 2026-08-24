import type {Permission, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

/**
 * Published authorization questions. Implementation composes {@link RoleRepository}
 * and {@link MembershipRolesPort} — never a cross-context join.
 */
export interface AuthorizationPort {
  require(actorId: UserId, permission: Permission, scope: {tenantId: TenantId}): Promise<void>
  getEffectivePermissions(userId: UserId, tenantId: TenantId): Promise<readonly Permission[]>
}
