import type {InvitationId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {Invitation} from '../invitation'

/**
 * Persistence port for tenant invitations. The raw token is never stored.
 */
export interface InvitationRepository {
  findById(id: InvitationId): Promise<Invitation | null>
  findActiveByTenantAndEmail(tenantId: TenantId, email: string): Promise<Invitation | null>
  findByTokenHash(tokenHash: string): Promise<Invitation | null>
  save(invitation: Invitation): Promise<void>
}
