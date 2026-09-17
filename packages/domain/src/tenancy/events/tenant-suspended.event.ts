import type {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {DomainEventBase} from '../../shared-kernel/domain-event-base'

export type TenantSuspendedEvent = DomainEventBase<'TenantSuspended'> & {
  readonly tenantId: TenantId
}
