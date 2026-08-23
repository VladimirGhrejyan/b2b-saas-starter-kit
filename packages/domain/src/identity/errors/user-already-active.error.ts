import {DomainError} from '../../shared-kernel/domain-error'

/**
 * Thrown when `User.activate` is called on an already-active user.
 */
export class UserAlreadyActiveError extends DomainError {
  constructor() {
    super('USER_ALREADY_ACTIVE', 'user is already active')
  }
}
