import type {ApiKeyId, Permission, TenantActor, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type CreateApiKeyCommand = {
  readonly actor: TenantActor
  readonly tenantId: TenantId
  readonly name: string
  readonly permissions: readonly Permission[]
  readonly expiresAt?: Date
}

export type CreateApiKeyResult = {
  readonly apiKeyId: ApiKeyId
  readonly token: string
}
