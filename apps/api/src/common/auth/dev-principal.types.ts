import type {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type DevPrincipal = {
  readonly userId: UserId
  readonly tenantId?: TenantId
}
