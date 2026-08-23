import type {RoleId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {Role} from '../role'

/**
 * Persistence port for tenant-scoped roles. Adapters join the ambient transaction.
 */
export interface RoleRepository {
  findById(id: RoleId): Promise<Role | null>
  findByTenant(tenantId: TenantId): Promise<Role[]>
  save(role: Role): Promise<void>
  saveMany(roles: Role[]): Promise<void>
}
