import type {ApiKeyId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {ApiKey} from '../api-key'

export const API_KEY_REPOSITORY = Symbol('API_KEY_REPOSITORY')

export interface ApiKeyRepository {
  findById(id: ApiKeyId): Promise<ApiKey | null>
  findByPrefix(prefix: string): Promise<ApiKey | null>
  findByTenant(tenantId: TenantId): Promise<readonly ApiKey[]>
  save(apiKey: ApiKey): Promise<void>
  touchLastUsed(id: ApiKeyId, at: Date): Promise<void>
}
