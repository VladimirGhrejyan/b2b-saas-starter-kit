import type {AcceptInvitationInput, AcceptInvitationOutput} from '@b2b-saas-starter-kit/contracts'

import type {AcceptInvitationUseCase} from '@b2b-saas-starter-kit/composition'

export class AcceptInvitationMapper {
  static toCommand(input: AcceptInvitationInput): Parameters<AcceptInvitationUseCase['execute']>[0] {
    return {
      token: input.token,
      displayName: input.displayName,
      password: input.password,
    }
  }

  static toOutput(result: Awaited<ReturnType<AcceptInvitationUseCase['execute']>>): AcceptInvitationOutput {
    return {
      userId: result.userId,
      membershipId: result.membershipId,
      tenantId: result.tenantId,
    }
  }
}
