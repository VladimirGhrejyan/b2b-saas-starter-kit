import type {ApiKeyId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {DomainEventBase} from '../../shared-kernel/domain-event-base'

export type ApiKeyCreatedEvent = DomainEventBase<'ApiKeyCreated'> & {
  readonly apiKeyId: ApiKeyId
  readonly tenantId: TenantId
  readonly createdByUserId: UserId
  readonly prefix: string
}
