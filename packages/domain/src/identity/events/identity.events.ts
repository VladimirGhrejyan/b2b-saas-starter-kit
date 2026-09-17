import type {UserActivatedEvent} from './user-activated.event'
import type {UserCreatedEvent} from './user-created.event'
import type {UserSuspendedEvent} from './user-suspended.event'

export type IdentityDomainEvent = UserCreatedEvent | UserSuspendedEvent | UserActivatedEvent
