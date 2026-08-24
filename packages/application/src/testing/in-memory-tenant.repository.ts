import type {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {Tenant, TenantRepository} from '@b2b-saas-starter-kit/domain'

import type {InMemorySnapshotable} from './in-memory-snapshotable'

/**
 * In-memory {@link TenantRepository} for application unit tests.
 */
export class InMemoryTenantRepository implements TenantRepository, InMemorySnapshotable {
  #tenants = new Map<TenantId, Tenant>()

  findById(id: TenantId): Promise<Tenant | null> {
    return Promise.resolve(this.#tenants.get(id) ?? null)
  }

  save(tenant: Tenant): Promise<void> {
    this.#tenants.set(tenant.id, tenant)

    return Promise.resolve()
  }

  snapshot(): unknown {
    return new Map(this.#tenants)
  }

  restore(snapshot: unknown): void {
    this.#tenants = new Map(snapshot as Map<TenantId, Tenant>)
  }
}
