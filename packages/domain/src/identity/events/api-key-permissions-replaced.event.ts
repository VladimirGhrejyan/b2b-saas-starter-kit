import type {ApiKeyId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {DomainEventBase} from '../../shared-kernel/domain-event-base'

export type ApiKeyPermissionsReplacedEvent = DomainEventBase<'ApiKeyPermissionsReplaced'> & {
  readonly apiKeyId: ApiKeyId
  readonly tenantId: TenantId
}
