import {DomainError} from '../../shared-kernel/domain-error'

/**
 * Thrown when {@link Invitation.consume} is called after expiry.
 */
export class InvitationExpiredError extends DomainError {
  constructor() {
    super('INVITATION_EXPIRED', 'invitation has expired')
  }
}
