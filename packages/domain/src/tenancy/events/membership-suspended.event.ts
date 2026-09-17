import type {MembershipId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {DomainEventBase} from '../../shared-kernel/domain-event-base'

export type MembershipSuspendedEvent = DomainEventBase<'MembershipSuspended'> & {
  readonly membershipId: MembershipId
  readonly tenantId: TenantId
  readonly userId: UserId
}
