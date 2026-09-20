import type {TenantActor, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'
import type {AttachMemberInput, AttachMemberOutput} from '@b2b-saas-starter-kit/contracts'

import type {AttachMemberUseCase} from '@b2b-saas-starter-kit/composition'

export class AttachMemberMapper {
  static toCommand(
    tenantId: TenantId,
    actor: TenantActor,
    input: AttachMemberInput,
  ): Parameters<AttachMemberUseCase['execute']>[0] {
    return {
      actor,
      tenantId,
      userId: input.userId,
      roleIds: input.roleIds,
    }
  }

  static toOutput(result: Awaited<ReturnType<AttachMemberUseCase['execute']>>): AttachMemberOutput {
    return {id: result.membershipId}
  }
}
