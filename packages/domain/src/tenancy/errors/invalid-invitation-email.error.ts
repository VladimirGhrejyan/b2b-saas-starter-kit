import {DomainError} from '../../shared-kernel/domain-error'

/**
 * Thrown when an invitation email is blank or not a simple local@domain form.
 */
export class InvalidInvitationEmailError extends DomainError {
  constructor() {
    super('INVITATION_INVALID_EMAIL', 'email must be a non-blank local@domain value')
  }
}
