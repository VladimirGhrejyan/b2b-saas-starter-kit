import {ApiKeyId, Permission, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {ApiKey} from '@b2b-saas-starter-kit/domain'

import {ApiKeyEntity} from '../entities/api-key.entity'

export const ApiKeyMapper = {
  toDomain(row: ApiKeyEntity): ApiKey {
    return ApiKey.reconstitute({
      id: ApiKeyId.parse(row.id),
      tenantId: TenantId.parse(row.tenantId),
      createdByUserId: UserId.parse(row.createdByUserId),
      name: row.name,
      prefix: row.prefix,
      secretHash: row.secretHash,
      permissions: row.permissions.map((permission) => Permission.parse(permission)),
      expiresAt: row.expiresAt ?? undefined,
      revokedAt: row.revokedAt ?? undefined,
      lastUsedAt: row.lastUsedAt ?? undefined,
    })
  },

  toEntity(apiKey: ApiKey): ApiKeyEntity {
    const row = new ApiKeyEntity()

    row.id = apiKey.id
    row.tenantId = apiKey.tenantId
    row.createdByUserId = apiKey.createdByUserId
    row.name = apiKey.name
    row.prefix = apiKey.prefix
    row.secretHash = apiKey.secretHash
    row.permissions = [...apiKey.permissions]
    row.expiresAt = apiKey.expiresAt ?? null
    row.revokedAt = apiKey.revokedAt ?? null
    row.lastUsedAt = apiKey.lastUsedAt ?? null

    return row
  },
}
