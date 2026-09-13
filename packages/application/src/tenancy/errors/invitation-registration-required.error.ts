/**
 * Thrown when accepting an invitation for an unknown email without displayName and password.
 */
export class InvitationRegistrationRequiredError extends Error {
  readonly code = 'INVITATION_REGISTRATION_REQUIRED'

  constructor() {
    super('displayName and password are required to accept as a new user')
    this.name = new.target.name
  }
}
