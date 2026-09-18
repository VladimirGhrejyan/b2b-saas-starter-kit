import type {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {Tenant} from '../tenant'

export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY')

/**
 * Persistence port for tenants.
 */
export interface TenantRepository {
  findById(id: TenantId): Promise<Tenant | null>
  save(tenant: Tenant): Promise<void>
}
