/**
 * Thrown when a local password already exists and currentPassword was omitted.
 */
export class PasswordAlreadySetError extends Error {
  readonly code = 'PASSWORD_ALREADY_SET'

  constructor() {
    super('a local password is already set')
    this.name = new.target.name
  }
}
