/**
 * Thrown when an invitation token is missing, expired, or already used.
 */
export class InvalidInvitationTokenError extends Error {
  readonly code = 'INVALID_INVITATION_TOKEN'

  constructor() {
    super('invitation token is invalid')
    this.name = new.target.name
  }
}
