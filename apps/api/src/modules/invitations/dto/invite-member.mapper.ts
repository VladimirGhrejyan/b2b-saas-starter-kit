import type {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'
import type {InviteMemberInput, InviteMemberOutput} from '@b2b-saas-starter-kit/contracts'

import type {InviteMemberUseCase} from '@b2b-saas-starter-kit/composition'

export class InviteMemberMapper {
  static toCommand(
    tenantId: TenantId,
    actorId: UserId,
    input: InviteMemberInput,
  ): Parameters<InviteMemberUseCase['execute']>[0] {
    return {
      actorId,
      tenantId,
      email: input.email,
      roleIds: input.roleIds,
    }
  }

  static toOutput(result: Awaited<ReturnType<InviteMemberUseCase['execute']>>): InviteMemberOutput {
    return {id: result.invitationId}
  }
}
