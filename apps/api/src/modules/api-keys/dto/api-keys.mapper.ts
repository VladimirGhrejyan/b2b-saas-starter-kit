import {Permission, type TenantActor, type TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'
import type {
  ApiKeyOutput,
  CreateApiKeyInput,
  CreateApiKeyOutput,
  TenantApiKeysOutput,
  UpdateApiKeyInput,
} from '@b2b-saas-starter-kit/contracts'

import type {
  CreateApiKeyUseCase,
  ListApiKeysQuery,
  RevokeApiKeyUseCase,
  UpdateApiKeyUseCase,
} from '@b2b-saas-starter-kit/composition'

export class ApiKeysMapper {
  static toCreateCommand(
    tenantId: TenantId,
    actor: TenantActor,
    input: CreateApiKeyInput,
  ): Parameters<CreateApiKeyUseCase['execute']>[0] {
    return {
      actor,
      tenantId,
      name: input.name,
      permissions: input.permissions.map((permission) => Permission.parse(permission)),
      expiresAt: input.expiresAt === undefined ? undefined : new Date(input.expiresAt),
    }
  }

  static toCreateOutput(result: Awaited<ReturnType<CreateApiKeyUseCase['execute']>>): CreateApiKeyOutput {
    return {id: result.apiKeyId, token: result.token}
  }

  static toListQuery(tenantId: TenantId, actor: TenantActor): Parameters<ListApiKeysQuery['execute']>[0] {
    return {tenantId, actor}
  }

  static toUpdateCommand(
    tenantId: TenantId,
    apiKeyId: Parameters<UpdateApiKeyUseCase['execute']>[0]['apiKeyId'],
    actor: TenantActor,
    input: UpdateApiKeyInput,
  ): Parameters<UpdateApiKeyUseCase['execute']>[0] {
    return {
      actor,
      tenantId,
      apiKeyId,
      name: input.name,
      permissions: input.permissions?.map((permission) => Permission.parse(permission)),
    }
  }

  static toRevokeCommand(
    tenantId: TenantId,
    apiKeyId: Parameters<RevokeApiKeyUseCase['execute']>[0]['apiKeyId'],
    actor: TenantActor,
  ): Parameters<RevokeApiKeyUseCase['execute']>[0] {
    return {actor, tenantId, apiKeyId}
  }

  static toApiKeyOutput(item: {
    readonly apiKeyId: ApiKeyOutput['id']
    readonly name: string
    readonly prefix: string
    readonly permissions: readonly string[]
    readonly expiresAt?: Date
    readonly revokedAt?: Date
    readonly lastUsedAt?: Date
  }): ApiKeyOutput {
    return {
      id: item.apiKeyId,
      name: item.name,
      prefix: item.prefix,
      permissions: item.permissions as ApiKeyOutput['permissions'],
      ...(item.expiresAt === undefined ? {} : {expiresAt: item.expiresAt.toISOString()}),
      ...(item.revokedAt === undefined ? {} : {revokedAt: item.revokedAt.toISOString()}),
      ...(item.lastUsedAt === undefined ? {} : {lastUsedAt: item.lastUsedAt.toISOString()}),
    }
  }

  static toListOutput(result: Awaited<ReturnType<ListApiKeysQuery['execute']>>): TenantApiKeysOutput {
    return {
      apiKeys: result.apiKeys.map((apiKey) => ApiKeysMapper.toApiKeyOutput(apiKey)),
    }
  }
}
