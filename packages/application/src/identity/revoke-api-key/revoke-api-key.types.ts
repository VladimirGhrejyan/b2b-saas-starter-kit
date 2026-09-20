import type {ApiKeyId, TenantActor, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type RevokeApiKeyCommand = {
  readonly actor: TenantActor
  readonly tenantId: TenantId
  readonly apiKeyId: ApiKeyId
}
