import type {RoleCreatedEvent} from './role-created.event'
import type {RolePermissionsReplacedEvent} from './role-permissions-replaced.event'
import type {RoleRenamedEvent} from './role-renamed.event'

export type AuthorizationDomainEvent = RoleCreatedEvent | RoleRenamedEvent | RolePermissionsReplacedEvent
