import type {ApiPermission} from '@b2b-saas-starter-kit/contracts'
import type {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {SessionState} from './session.state'

export class SessionSelectors {
  static state(root: {session: SessionState}): SessionState {
    return root.session
  }

  static userId(root: {session: SessionState}): UserId | null {
    return root.session.userId
  }

  static activeTenantId(root: {session: SessionState}): TenantId | null {
    return root.session.activeTenantId
  }

  static effectivePermissions(root: {session: SessionState}): ApiPermission[] {
    return root.session.effectivePermissions
  }
}
