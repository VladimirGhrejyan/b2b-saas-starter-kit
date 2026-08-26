import {Inject, Injectable} from '@nestjs/common'

import type {TenantContext} from '@b2b-saas-starter-kit/composition'
import {GetMyProfileQuery, TENANT_CONTEXT} from '@b2b-saas-starter-kit/composition'

import {MeMapper} from './dto/me.mapper'
import type {MeOutputDto} from './dto/me.output'

@Injectable()
export class MeService {
  constructor(
    private readonly getMyProfile: GetMyProfileQuery,
    @Inject(TENANT_CONTEXT) private readonly tenantContext: TenantContext,
  ) {}

  async get(): Promise<MeOutputDto> {
    const result = await this.getMyProfile.execute(
      MeMapper.toQuery(this.tenantContext.getActorId(), this.tenantContext.getTenantId()),
    )

    return MeMapper.toOutput(result)
  }
}
