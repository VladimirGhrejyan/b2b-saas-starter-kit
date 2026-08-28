import {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'
import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

export function getMeQuery(userId: UserId | null, tenantId: TenantId | null) {
  if (TypeScriptUtils.isNil(userId) || TypeScriptUtils.isNil(tenantId)) {
    return {
      skip: true,
      arg: {
        userId: UserId.parse('00000000-0000-4000-8000-000000000001'),
        tenantId: TenantId.parse('00000000-0000-4000-8000-000000000002'),
      },
    }
  }

  return {
    skip: false,
    arg: {userId, tenantId},
  }
}
