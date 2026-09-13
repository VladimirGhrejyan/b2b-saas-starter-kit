import type {ApiPermission} from '@b2b-saas-starter-kit/contracts'
import type {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type SessionState = {
  accessToken: string | null
  userId: UserId | null
  activeTenantId: TenantId | null
  effectivePermissions: ApiPermission[]
}

export const sessionInitialState: SessionState = {
  accessToken: null,
  userId: null,
  activeTenantId: null,
  effectivePermissions: [],
}
