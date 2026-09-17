import type {RoleId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {DomainEventBase} from '../../shared-kernel/domain-event-base'

export type RoleCreatedEvent = DomainEventBase<'RoleCreated'> & {
  readonly roleId: RoleId
  readonly tenantId: TenantId
  readonly name: string
  readonly isSystem: boolean
}
