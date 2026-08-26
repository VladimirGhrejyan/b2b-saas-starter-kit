import {Inject, Injectable} from '@nestjs/common'

import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {TenantContext} from '@b2b-saas-starter-kit/composition'
import {CreateTenantUseCase, TENANT_CONTEXT} from '@b2b-saas-starter-kit/composition'

import type {CreateTenantInputDto} from './dto/create-tenant.input'
import {CreateTenantMapper} from './dto/create-tenant.mapper'
import type {CreateTenantOutputDto} from './dto/create-tenant.output'

@Injectable()
export class TenantsService {
  constructor(
    private readonly createTenant: CreateTenantUseCase,
    @Inject(TENANT_CONTEXT) private readonly tenantContext: TenantContext,
  ) {}

  async create(input: CreateTenantInputDto, ownerUserId: UserId): Promise<CreateTenantOutputDto> {
    const result = await this.tenantContext.withoutTenantScope(() =>
      this.createTenant.execute(CreateTenantMapper.toCommand(input, ownerUserId)),
    )

    return CreateTenantMapper.toOutput(result)
  }
}
