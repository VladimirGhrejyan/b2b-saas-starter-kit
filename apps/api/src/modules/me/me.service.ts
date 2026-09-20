import {ForbiddenException, Inject, Injectable} from '@nestjs/common'

import {TenantActorKind} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {TenantContext} from '@b2b-saas-starter-kit/platform'
import {TENANT_CONTEXT} from '@b2b-saas-starter-kit/platform'

import {GetMyProfileQuery} from '@b2b-saas-starter-kit/composition'

import {MeMapper} from './dto/me.mapper'
import type {MeOutputDto} from './dto/me.output'

@Injectable()
export class MeService {
  constructor(
    private readonly getMyProfile: GetMyProfileQuery,
    @Inject(TENANT_CONTEXT) private readonly tenantContext: TenantContext,
  ) {}

  async get(): Promise<MeOutputDto> {
    const actor = this.tenantContext.getActor()

    if (actor.kind !== TenantActorKind.user) {
      throw new ForbiddenException('user principal is required')
    }

    const result = await this.getMyProfile.execute(MeMapper.toQuery(actor.id, this.tenantContext.getTenantId()))

    return MeMapper.toOutput(result)
  }
}
