import {DomainError} from '../shared-kernel/domain-error'

/**
 * Thrown when a user display name is blank.
 */
export class InvalidUserDisplayNameError extends DomainError {
  constructor() {
    super('USER_INVALID_DISPLAY_NAME', 'displayName must not be blank')
  }
}
