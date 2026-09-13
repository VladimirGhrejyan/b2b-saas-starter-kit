import {DomainError} from '../../shared-kernel/domain-error'

/**
 * Thrown when {@link Invitation.consume} is called on an already consumed invitation.
 */
export class InvitationAlreadyConsumedError extends DomainError {
  constructor() {
    super('INVITATION_ALREADY_CONSUMED', 'invitation has already been consumed')
  }
}
