import {Injectable} from '@nestjs/common'

import type {MembershipId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {
  AttachMemberUseCase,
  ListTenantMembersQuery,
  ReplaceMembershipRolesUseCase,
} from '@b2b-saas-starter-kit/composition'

import type {AttachMemberInputDto} from './dto/attach-member.input'
import {AttachMemberMapper} from './dto/attach-member.mapper'
import type {AttachMemberOutputDto} from './dto/attach-member.output'
import type {ReplaceMembershipRolesInputDto} from './dto/replace-membership-roles.input'
import {ReplaceMembershipRolesMapper} from './dto/replace-membership-roles.mapper'
import type {ReplaceMembershipRolesOutputDto} from './dto/replace-membership-roles.output'
import {TenantMembersMapper} from './dto/tenant-members.mapper'
import type {TenantMembersOutputDto} from './dto/tenant-members.output'

@Injectable()
export class MembersService {
  constructor(
    private readonly listTenantMembers: ListTenantMembersQuery,
    private readonly attachMember: AttachMemberUseCase,
    private readonly replaceMembershipRoles: ReplaceMembershipRolesUseCase,
  ) {}

  async list(tenantId: TenantId, actorId: UserId): Promise<TenantMembersOutputDto> {
    const result = await this.listTenantMembers.execute(TenantMembersMapper.toQuery(tenantId, actorId))

    return TenantMembersMapper.toOutput(result)
  }

  async attach(tenantId: TenantId, actorId: UserId, input: AttachMemberInputDto): Promise<AttachMemberOutputDto> {
    const result = await this.attachMember.execute(AttachMemberMapper.toCommand(tenantId, actorId, input))

    return AttachMemberMapper.toOutput(result)
  }

  async replaceRoles(
    tenantId: TenantId,
    membershipId: MembershipId,
    actorId: UserId,
    input: ReplaceMembershipRolesInputDto,
  ): Promise<ReplaceMembershipRolesOutputDto> {
    const result = await this.replaceMembershipRoles.execute(
      ReplaceMembershipRolesMapper.toCommand(tenantId, membershipId, actorId, input),
    )

    return ReplaceMembershipRolesMapper.toOutput(result)
  }
}
