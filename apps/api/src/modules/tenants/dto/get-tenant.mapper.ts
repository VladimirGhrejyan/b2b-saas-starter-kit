import type {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'
import type {GetTenantOutput} from '@b2b-saas-starter-kit/contracts'

import type {GetTenantQuery} from '@b2b-saas-starter-kit/composition'

export class GetTenantMapper {
  static toQuery(tenantId: TenantId, actorId: UserId): Parameters<GetTenantQuery['execute']>[0] {
    return {tenantId, actorId}
  }

  static toOutput(result: Awaited<ReturnType<GetTenantQuery['execute']>>): GetTenantOutput {
    return {id: result.id, name: result.name}
  }
}
