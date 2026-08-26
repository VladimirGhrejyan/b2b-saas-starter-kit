import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'
import type {CreateTenantInput, CreateTenantOutput} from '@b2b-saas-starter-kit/contracts'

import type {CreateTenantUseCase} from '@b2b-saas-starter-kit/composition'

export class CreateTenantMapper {
  static toCommand(input: CreateTenantInput, ownerUserId: UserId): Parameters<CreateTenantUseCase['execute']>[0] {
    return {
      name: input.name,
      ownerUserId,
    }
  }

  static toOutput(result: Awaited<ReturnType<CreateTenantUseCase['execute']>>): CreateTenantOutput {
    return {
      id: result.tenantId,
      ownerMembershipId: result.ownerMembershipId,
      roleIds: result.roleIds,
    }
  }
}
