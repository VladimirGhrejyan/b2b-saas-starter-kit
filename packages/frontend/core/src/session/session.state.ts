import type {ApiPermission} from '@b2b-saas-starter-kit/contracts'
import type {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type SessionState = {
  userId: UserId | null
  activeTenantId: TenantId | null
  effectivePermissions: ApiPermission[]
}

export const sessionInitialState: SessionState = {
  userId: null,
  activeTenantId: null,
  effectivePermissions: [],
}
