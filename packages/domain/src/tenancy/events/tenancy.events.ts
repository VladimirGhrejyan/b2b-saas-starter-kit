import type {InvitationConsumedEvent} from './invitation-consumed.event'
import type {InvitationCreatedEvent} from './invitation-created.event'
import type {MembershipActivatedEvent} from './membership-activated.event'
import type {MembershipCreatedEvent} from './membership-created.event'
import type {MembershipRolesReplacedEvent} from './membership-roles-replaced.event'
import type {MembershipSuspendedEvent} from './membership-suspended.event'
import type {TenantActivatedEvent} from './tenant-activated.event'
import type {TenantCreatedEvent} from './tenant-created.event'
import type {TenantRenamedEvent} from './tenant-renamed.event'
import type {TenantSuspendedEvent} from './tenant-suspended.event'

export type TenancyDomainEvent =
  | TenantCreatedEvent
  | TenantRenamedEvent
  | TenantSuspendedEvent
  | TenantActivatedEvent
  | MembershipCreatedEvent
  | MembershipRolesReplacedEvent
  | MembershipActivatedEvent
  | MembershipSuspendedEvent
  | InvitationCreatedEvent
  | InvitationConsumedEvent
