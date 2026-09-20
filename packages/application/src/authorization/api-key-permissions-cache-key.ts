import type {ApiKeyId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {CacheKey} from '@b2b-saas-starter-kit/platform'

export function apiKeyPermissionsCacheKey(tenantId: TenantId, apiKeyId: ApiKeyId): string {
  return CacheKey.tenant(tenantId, 'authorization', 'api-key-permissions', apiKeyId)
}
