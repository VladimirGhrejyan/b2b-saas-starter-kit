/**
 * Thrown when a new password does not meet the minimum length.
 */
export class InvalidPasswordError extends Error {
  readonly code = 'INVALID_PASSWORD'

  constructor() {
    super('password does not meet the minimum length')
    this.name = new.target.name
  }
}
