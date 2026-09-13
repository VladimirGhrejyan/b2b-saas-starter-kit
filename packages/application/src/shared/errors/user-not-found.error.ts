/**
 * Thrown when a user id is unknown.
 */
export class UserNotFoundError extends Error {
  readonly code = 'USER_NOT_FOUND'

  constructor() {
    super('user was not found')
    this.name = new.target.name
  }
}
