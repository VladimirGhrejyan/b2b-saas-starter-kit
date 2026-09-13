/**
 * Thrown when a pending invitation already exists for the tenant and email.
 */
export class InvitationAlreadyPendingError extends Error {
  readonly code = 'INVITATION_ALREADY_PENDING'

  constructor() {
    super('an invitation is already pending for this email')
    this.name = new.target.name
  }
}
