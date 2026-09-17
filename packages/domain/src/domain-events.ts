import type {AuthorizationDomainEvent} from './authorization/events/authorization.events'
import type {IdentityDomainEvent} from './identity/events/identity.events'
import type {TenancyDomainEvent} from './tenancy/events/tenancy.events'

/**
 * Every domain event across implemented bounded contexts.
 *
 * Aggregates record events; application code pulls and publishes them.
 */
export type DomainEvent = IdentityDomainEvent | TenancyDomainEvent | AuthorizationDomainEvent
