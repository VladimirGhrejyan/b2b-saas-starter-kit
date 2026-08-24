import type {MembershipId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {Membership, MembershipRepository} from '@b2b-saas-starter-kit/domain'

import type {InMemorySnapshotable} from './in-memory-snapshotable'

/**
 * In-memory {@link MembershipRepository} for application unit tests.
 */
export class InMemoryMembershipRepository implements MembershipRepository, InMemorySnapshotable {
  #memberships = new Map<MembershipId, Membership>()

  findById(id: MembershipId): Promise<Membership | null> {
    return Promise.resolve(this.#memberships.get(id) ?? null)
  }

  findByTenant(tenantId: TenantId): Promise<Membership[]> {
    return Promise.resolve([...this.#memberships.values()].filter((membership) => membership.tenantId === tenantId))
  }

  findByUserAndTenant(userId: UserId, tenantId: TenantId): Promise<Membership | null> {
    for (const membership of this.#memberships.values()) {
      if (membership.userId === userId && membership.tenantId === tenantId) {
        return Promise.resolve(membership)
      }
    }

    return Promise.resolve(null)
  }

  save(membership: Membership): Promise<void> {
    this.#memberships.set(membership.id, membership)

    return Promise.resolve()
  }

  snapshot(): unknown {
    return new Map(this.#memberships)
  }

  restore(snapshot: unknown): void {
    this.#memberships = new Map(snapshot as Map<MembershipId, Membership>)
  }
}
