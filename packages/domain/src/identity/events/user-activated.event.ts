import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {DomainEventBase} from '../../shared-kernel/domain-event-base'

export type UserActivatedEvent = DomainEventBase<'UserActivated'> & {
  readonly userId: UserId
}
