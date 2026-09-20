import type {TenantActor, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type GetTenantQueryInput = {
  readonly tenantId: TenantId
  readonly actor: TenantActor
}

export type GetTenantResult = {
  readonly id: TenantId
  readonly name: string
}
