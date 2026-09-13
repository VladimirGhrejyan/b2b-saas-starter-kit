import type {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type GetTenantQueryInput = {
  readonly tenantId: TenantId
  readonly actorId: UserId
}

export type GetTenantResult = {
  readonly id: TenantId
  readonly name: string
}
