import type {ApiKeyId, Permission, TenantActor, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type UpdateApiKeyCommand = {
  readonly actor: TenantActor
  readonly tenantId: TenantId
  readonly apiKeyId: ApiKeyId
  readonly name?: string
  readonly permissions?: readonly Permission[]
}

export type UpdateApiKeyResult = {
  readonly apiKeyId: ApiKeyId
  readonly name: string
  readonly prefix: string
  readonly permissions: readonly Permission[]
  readonly expiresAt?: Date
  readonly revokedAt?: Date
  readonly lastUsedAt?: Date
}
