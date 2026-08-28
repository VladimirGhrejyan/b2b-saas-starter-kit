import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

import {SessionSelectors} from '../../session/session.selectors'
import type {SessionState} from '../../session/session.state'

export function prepareHeaders(headers: Headers, api: {getState: () => unknown}): Headers {
  const state = api.getState() as {session: SessionState}
  const userId = SessionSelectors.userId(state)
  const tenantId = SessionSelectors.activeTenantId(state)

  if (!TypeScriptUtils.isNil(userId)) {
    headers.set('x-user-id', userId)
  }

  if (!TypeScriptUtils.isNil(tenantId)) {
    headers.set('x-tenant-id', tenantId)
  }

  return headers
}
