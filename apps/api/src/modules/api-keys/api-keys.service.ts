import {Injectable} from '@nestjs/common'

import type {ApiKeyId, TenantActor, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {
  CreateApiKeyUseCase,
  ListApiKeysQuery,
  RevokeApiKeyUseCase,
  UpdateApiKeyUseCase,
} from '@b2b-saas-starter-kit/composition'

import type {ApiKeyOutputDto} from './dto/api-key.output'
import {ApiKeysMapper} from './dto/api-keys.mapper'
import type {CreateApiKeyInputDto} from './dto/create-api-key.input'
import type {CreateApiKeyOutputDto} from './dto/create-api-key.output'
import type {TenantApiKeysOutputDto} from './dto/tenant-api-keys.output'
import type {UpdateApiKeyInputDto} from './dto/update-api-key.input'

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly createApiKey: CreateApiKeyUseCase,
    private readonly listApiKeys: ListApiKeysQuery,
    private readonly updateApiKey: UpdateApiKeyUseCase,
    private readonly revokeApiKey: RevokeApiKeyUseCase,
  ) {}

  async create(tenantId: TenantId, actor: TenantActor, input: CreateApiKeyInputDto): Promise<CreateApiKeyOutputDto> {
    const result = await this.createApiKey.execute(ApiKeysMapper.toCreateCommand(tenantId, actor, input))

    return ApiKeysMapper.toCreateOutput(result)
  }

  async list(tenantId: TenantId, actor: TenantActor): Promise<TenantApiKeysOutputDto> {
    const result = await this.listApiKeys.execute(ApiKeysMapper.toListQuery(tenantId, actor))

    return ApiKeysMapper.toListOutput(result)
  }

  async update(
    tenantId: TenantId,
    apiKeyId: ApiKeyId,
    actor: TenantActor,
    input: UpdateApiKeyInputDto,
  ): Promise<ApiKeyOutputDto> {
    const result = await this.updateApiKey.execute(ApiKeysMapper.toUpdateCommand(tenantId, apiKeyId, actor, input))

    return ApiKeysMapper.toApiKeyOutput(result)
  }

  async revoke(tenantId: TenantId, apiKeyId: ApiKeyId, actor: TenantActor): Promise<void> {
    await this.revokeApiKey.execute(ApiKeysMapper.toRevokeCommand(tenantId, apiKeyId, actor))
  }
}
