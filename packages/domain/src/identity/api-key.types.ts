import type {ApiKeyId, Permission, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

/**
 * Persisted API key state used by repository adapters. Does not record events.
 */
export type ApiKeyReconstituteProps = {
  readonly id: ApiKeyId
  readonly tenantId: TenantId
  readonly createdByUserId: UserId
  readonly name: string
  readonly prefix: string
  readonly secretHash: string
  readonly permissions: readonly Permission[]
  readonly expiresAt?: Date
  readonly revokedAt?: Date
  readonly lastUsedAt?: Date
}
