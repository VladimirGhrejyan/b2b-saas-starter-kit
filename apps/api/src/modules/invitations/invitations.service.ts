import {Inject, Injectable} from '@nestjs/common'

import type {TenantActor, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {TenantContext} from '@b2b-saas-starter-kit/platform'
import {TENANT_CONTEXT} from '@b2b-saas-starter-kit/platform'

import {AcceptInvitationUseCase, InviteMemberUseCase} from '@b2b-saas-starter-kit/composition'

import type {AcceptInvitationInputDto} from './dto/accept-invitation.input'
import {AcceptInvitationMapper} from './dto/accept-invitation.mapper'
import type {AcceptInvitationOutputDto} from './dto/accept-invitation.output'
import type {InviteMemberInputDto} from './dto/invite-member.input'
import {InviteMemberMapper} from './dto/invite-member.mapper'
import type {InviteMemberOutputDto} from './dto/invite-member.output'

@Injectable()
export class InvitationsService {
  constructor(
    private readonly inviteMember: InviteMemberUseCase,
    private readonly acceptInvitation: AcceptInvitationUseCase,
    @Inject(TENANT_CONTEXT) private readonly tenantContext: TenantContext,
  ) {}

  async invite(tenantId: TenantId, actor: TenantActor, input: InviteMemberInputDto): Promise<InviteMemberOutputDto> {
    const result = await this.inviteMember.execute(InviteMemberMapper.toCommand(tenantId, actor, input))

    return InviteMemberMapper.toOutput(result)
  }

  async accept(input: AcceptInvitationInputDto): Promise<AcceptInvitationOutputDto> {
    const result = await this.tenantContext.withoutTenantScope(() =>
      this.acceptInvitation.execute(AcceptInvitationMapper.toCommand(input)),
    )

    return AcceptInvitationMapper.toOutput(result)
  }
}
