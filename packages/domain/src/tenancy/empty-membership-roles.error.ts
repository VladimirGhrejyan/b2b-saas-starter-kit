import {DomainError} from '../shared-kernel/domain-error'

/**
 * Thrown when `Membership.create` is given no role ids.
 */
export class EmptyMembershipRolesError extends DomainError {
  constructor() {
    super('MEMBERSHIP_EMPTY_ROLES', 'a membership must have at least one role')
  }
}
