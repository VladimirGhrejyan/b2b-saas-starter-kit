import type {InvitationId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {DomainEventBase} from '../../shared-kernel/domain-event-base'

export type InvitationCreatedEvent = DomainEventBase<'InvitationCreated'> & {
  readonly invitationId: InvitationId
  readonly tenantId: TenantId
  readonly email: string
  readonly invitedByUserId: UserId
}
