import type {InvitationId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {DomainEventBase} from '../../shared-kernel/domain-event-base'

export type InvitationConsumedEvent = DomainEventBase<'InvitationConsumed'> & {
  readonly invitationId: InvitationId
  readonly tenantId: TenantId
  readonly email: string
}
