import type {RoleId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {Role, RoleRepository} from '@b2b-saas-starter-kit/domain'

import type {InMemorySnapshotable} from './in-memory-snapshotable'

/**
 * In-memory {@link RoleRepository} for application unit tests.
 */
export class InMemoryRoleRepository implements RoleRepository, InMemorySnapshotable {
  #roles = new Map<RoleId, Role>()

  findById(id: RoleId): Promise<Role | null> {
    return Promise.resolve(this.#roles.get(id) ?? null)
  }

  findByTenant(tenantId: TenantId): Promise<Role[]> {
    return Promise.resolve([...this.#roles.values()].filter((role) => role.tenantId === tenantId))
  }

  save(role: Role): Promise<void> {
    this.#roles.set(role.id, role)

    return Promise.resolve()
  }

  saveMany(roles: Role[]): Promise<void> {
    for (const role of roles) {
      this.#roles.set(role.id, role)
    }

    return Promise.resolve()
  }

  snapshot(): unknown {
    return new Map(this.#roles)
  }

  restore(snapshot: unknown): void {
    this.#roles = new Map(snapshot as Map<RoleId, Role>)
  }
}
