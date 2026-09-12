/**
 * Thrown when email/password do not match an active local credential.
 */
export class InvalidCredentialsError extends Error {
  readonly code = 'INVALID_CREDENTIALS'

  constructor() {
    super('invalid email or password')
    this.name = new.target.name
  }
}
