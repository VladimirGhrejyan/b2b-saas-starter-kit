import type {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type SelectTenantCommand = {
  readonly userId: UserId
  readonly tenantId: TenantId
}

export type SelectTenantResult = {
  readonly userId: UserId
  readonly tenantId: TenantId
}
