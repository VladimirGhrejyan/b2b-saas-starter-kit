import type {ApiKeyId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type ResolveApiKeyResult = {
  readonly apiKeyId: ApiKeyId
  readonly tenantId: TenantId
}
