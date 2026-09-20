import type {InvitationId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {Invitation, InvitationRepository} from '@b2b-saas-starter-kit/domain'

import type {InMemorySnapshotable} from './in-memory-snapshotable'

/**
 * In-memory {@link InvitationRepository} for application unit tests.
 */
export class InMemoryInvitationRepository implements InvitationRepository, InMemorySnapshotable {
  #invitations = new Map<InvitationId, Invitation>()

  findById(id: InvitationId): Promise<Invitation | null> {
    return Promise.resolve(this.#invitations.get(id) ?? null)
  }

  findActiveByTenantAndEmail(tenantId: TenantId, email: string): Promise<Invitation | null> {
    const normalized = email.trim().toLowerCase()

    for (const invitation of this.#invitations.values()) {
      if (invitation.tenantId === tenantId && invitation.email === normalized && invitation.consumedAt === undefined) {
        return Promise.resolve(invitation)
      }
    }

    return Promise.resolve(null)
  }

  findByTokenHash(tokenHash: string): Promise<Invitation | null> {
    for (const invitation of this.#invitations.values()) {
      if (invitation.tokenHash === tokenHash) {
        return Promise.resolve(invitation)
      }
    }

    return Promise.resolve(null)
  }

  save(invitation: Invitation): Promise<void> {
    this.#invitations.set(invitation.id, invitation)

    return Promise.resolve()
  }

  deleteStale(before: Date, limit: number): Promise<number> {
    const stale = [...this.#invitations.values()].filter((invitation) => !invitation.isActive(before)).slice(0, limit)

    for (const invitation of stale) {
      this.#invitations.delete(invitation.id)
    }

    return Promise.resolve(stale.length)
  }

  snapshot(): unknown {
    return new Map(this.#invitations)
  }

  restore(snapshot: unknown): void {
    this.#invitations = new Map(snapshot as Map<InvitationId, Invitation>)
  }
}
