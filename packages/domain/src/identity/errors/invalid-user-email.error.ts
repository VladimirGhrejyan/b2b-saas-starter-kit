import {DomainError} from '../../shared-kernel/domain-error'

/**
 * Thrown when a user email is blank or not a simple local@domain form.
 */
export class InvalidUserEmailError extends DomainError {
  constructor() {
    super('USER_INVALID_EMAIL', 'email must be a non-blank local@domain value')
  }
}
