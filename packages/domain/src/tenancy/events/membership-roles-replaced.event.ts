import type {MembershipId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {DomainEventBase} from '../../shared-kernel/domain-event-base'

export type MembershipRolesReplacedEvent = DomainEventBase<'MembershipRolesReplaced'> & {
  readonly membershipId: MembershipId
  readonly tenantId: TenantId
  readonly userId: UserId
  readonly roleIds: readonly RoleId[]
}
