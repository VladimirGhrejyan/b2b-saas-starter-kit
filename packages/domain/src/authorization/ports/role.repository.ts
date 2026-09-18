import type {RoleId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {Role} from '../role'

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY')

/**
 * Persistence port for tenant-scoped roles. Adapters join the ambient transaction.
 */
export interface RoleRepository {
  findById(id: RoleId): Promise<Role | null>
  findByIds(ids: readonly RoleId[]): Promise<Role[]>
  findByTenant(tenantId: TenantId): Promise<Role[]>
  save(role: Role): Promise<void>
  saveMany(roles: Role[]): Promise<void>
  delete(id: RoleId): Promise<void>
}
