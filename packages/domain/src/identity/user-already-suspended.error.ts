import {DomainError} from '../shared-kernel/domain-error'

/**
 * Thrown when `User.suspend` is called on an already-suspended user.
 */
export class UserAlreadySuspendedError extends DomainError {
  constructor() {
    super('USER_ALREADY_SUSPENDED', 'user is already suspended')
  }
}
