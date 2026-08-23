import {DomainError} from '../shared-kernel/domain-error'

/**
 * Thrown when `Membership.suspend` is called on an already-suspended membership.
 */
export class MembershipAlreadySuspendedError extends DomainError {
  constructor() {
    super('MEMBERSHIP_ALREADY_SUSPENDED', 'membership is already suspended')
  }
}
