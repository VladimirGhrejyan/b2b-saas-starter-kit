import type {AuthSessionOutput} from '@b2b-saas-starter-kit/contracts'
import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

import type {SessionState} from './session.state'

export function sessionFromAuthOutput(output: AuthSessionOutput): SessionState {
  return {
    accessToken: output.accessToken,
    userId: output.userId,
    activeTenantId: TypeScriptUtils.isNil(output.tenantId) ? null : output.tenantId,
    effectivePermissions: [],
  }
}
