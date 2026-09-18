import {Inject, Injectable} from '@nestjs/common'

import type {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {TenantContext} from '@b2b-saas-starter-kit/platform'
import {TENANT_CONTEXT} from '@b2b-saas-starter-kit/platform'

import {CreateTenantUseCase, GetTenantQuery} from '@b2b-saas-starter-kit/composition'

import type {CreateTenantInputDto} from './dto/create-tenant.input'
import {CreateTenantMapper} from './dto/create-tenant.mapper'
import type {CreateTenantOutputDto} from './dto/create-tenant.output'
import {GetTenantMapper} from './dto/get-tenant.mapper'
import type {GetTenantOutputDto} from './dto/get-tenant.output'

@Injectable()
export class TenantsService {
  constructor(
    private readonly createTenant: CreateTenantUseCase,
    private readonly getTenant: GetTenantQuery,
    @Inject(TENANT_CONTEXT) private readonly tenantContext: TenantContext,
  ) {}

  async create(input: CreateTenantInputDto, ownerUserId: UserId): Promise<CreateTenantOutputDto> {
    const result = await this.tenantContext.withoutTenantScope(() =>
      this.createTenant.execute(CreateTenantMapper.toCommand(input, ownerUserId)),
    )

    return CreateTenantMapper.toOutput(result)
  }

  async get(tenantId: TenantId, actorId: UserId): Promise<GetTenantOutputDto> {
    const result = await this.getTenant.execute(GetTenantMapper.toQuery(tenantId, actorId))

    return GetTenantMapper.toOutput(result)
  }
}
