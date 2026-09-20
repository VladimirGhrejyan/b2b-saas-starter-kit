import type {ApiKeyCreatedEvent} from './api-key-created.event'
import type {ApiKeyPermissionsReplacedEvent} from './api-key-permissions-replaced.event'
import type {ApiKeyRevokedEvent} from './api-key-revoked.event'
import type {UserActivatedEvent} from './user-activated.event'
import type {UserCreatedEvent} from './user-created.event'
import type {UserSuspendedEvent} from './user-suspended.event'

export type IdentityDomainEvent =
  | UserCreatedEvent
  | UserSuspendedEvent
  | UserActivatedEvent
  | ApiKeyCreatedEvent
  | ApiKeyRevokedEvent
  | ApiKeyPermissionsReplacedEvent
