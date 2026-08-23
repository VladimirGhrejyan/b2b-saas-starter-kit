import {DomainError} from '../../shared-kernel/domain-error'

/**
 * Thrown when `Membership.activate` is called on an already-active membership.
 */
export class MembershipAlreadyActiveError extends DomainError {
  constructor() {
    super('MEMBERSHIP_ALREADY_ACTIVE', 'membership is already active')
  }
}
