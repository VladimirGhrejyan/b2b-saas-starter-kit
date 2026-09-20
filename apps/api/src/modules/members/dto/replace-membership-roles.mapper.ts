import type {MembershipId, TenantActor, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'
import type {ReplaceMembershipRolesInput, ReplaceMembershipRolesOutput} from '@b2b-saas-starter-kit/contracts'

import type {ReplaceMembershipRolesUseCase} from '@b2b-saas-starter-kit/composition'

export class ReplaceMembershipRolesMapper {
  static toCommand(
    tenantId: TenantId,
    membershipId: MembershipId,
    actor: TenantActor,
    input: ReplaceMembershipRolesInput,
  ): Parameters<ReplaceMembershipRolesUseCase['execute']>[0] {
    return {
      actor,
      tenantId,
      membershipId,
      roleIds: input.roleIds,
    }
  }

  static toOutput(result: Awaited<ReturnType<ReplaceMembershipRolesUseCase['execute']>>): ReplaceMembershipRolesOutput {
    return {
      membershipId: result.membershipId,
      roleIds: [...result.roleIds],
    }
  }
}
