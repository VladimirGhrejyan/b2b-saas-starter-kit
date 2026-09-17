import type {MembershipId, MembershipStatus, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {DomainEventBase} from '../../shared-kernel/domain-event-base'

export type MembershipCreatedEvent = DomainEventBase<'MembershipCreated'> & {
  readonly membershipId: MembershipId
  readonly tenantId: TenantId
  readonly userId: UserId
  readonly roleIds: readonly RoleId[]
  readonly status: MembershipStatus
}
