import {Injectable} from '@nestjs/common'

import type {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {ListTenantMembersQuery} from '@b2b-saas-starter-kit/composition'

import {TenantMembersMapper} from './dto/tenant-members.mapper'
import type {TenantMembersOutputDto} from './dto/tenant-members.output'

@Injectable()
export class MembersService {
  constructor(private readonly listTenantMembers: ListTenantMembersQuery) {}

  async list(tenantId: TenantId, actorId: UserId): Promise<TenantMembersOutputDto> {
    const result = await this.listTenantMembers.execute(TenantMembersMapper.toQuery(tenantId, actorId))

    return TenantMembersMapper.toOutput(result)
  }
}
