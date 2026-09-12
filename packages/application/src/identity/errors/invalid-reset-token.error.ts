/**
 * Thrown when a password-reset token is missing, expired, or already used.
 */
export class InvalidResetTokenError extends Error {
  readonly code = 'INVALID_RESET_TOKEN'

  constructor() {
    super('password reset token is invalid')
    this.name = new.target.name
  }
}
