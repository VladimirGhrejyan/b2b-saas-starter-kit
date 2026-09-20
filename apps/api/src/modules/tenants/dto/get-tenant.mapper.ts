import type {TenantActor, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'
import type {GetTenantOutput} from '@b2b-saas-starter-kit/contracts'

import type {GetTenantQuery} from '@b2b-saas-starter-kit/composition'

export class GetTenantMapper {
  static toQuery(tenantId: TenantId, actor: TenantActor): Parameters<GetTenantQuery['execute']>[0] {
    return {tenantId, actor}
  }

  static toOutput(result: Awaited<ReturnType<GetTenantQuery['execute']>>): GetTenantOutput {
    return {id: result.id, name: result.name}
  }
}
