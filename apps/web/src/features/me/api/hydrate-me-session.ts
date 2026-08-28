import type {MeOutput} from '@b2b-saas-starter-kit/contracts'
import type {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'
import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'
import {type AppDispatch, setSession} from '@b2b-saas-starter-kit/frontend-core'

export function hydrateMeSession(dispatch: AppDispatch, fallbackTenantId: TenantId, data: MeOutput): void {
  dispatch(
    setSession({
      userId: data.user.id,
      activeTenantId: TypeScriptUtils.isNil(data.membership) ? fallbackTenantId : data.membership.tenantId,
      effectivePermissions: data.effectivePermissions,
    }),
  )
}
