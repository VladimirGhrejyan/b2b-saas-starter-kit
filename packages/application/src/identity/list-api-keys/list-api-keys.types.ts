import type {ApiKeyId, Permission, TenantActor, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type ListApiKeysQueryInput = {
  readonly actor: TenantActor
  readonly tenantId: TenantId
}

export type ApiKeyListItem = {
  readonly apiKeyId: ApiKeyId
  readonly name: string
  readonly prefix: string
  readonly permissions: readonly Permission[]
  readonly expiresAt?: Date
  readonly revokedAt?: Date
  readonly lastUsedAt?: Date
}

export type ListApiKeysResult = {
  readonly apiKeys: readonly ApiKeyListItem[]
}
