import type {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {CacheKey} from '@b2b-saas-starter-kit/platform'

export function effectivePermissionsCacheKey(tenantId: TenantId, userId: UserId): string {
  return CacheKey.tenant(tenantId, 'authorization', 'effective-permissions', userId)
}
