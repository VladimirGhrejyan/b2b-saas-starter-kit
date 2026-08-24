/**
 * Thrown when {@link GetMyProfileQuery} cannot load the actor user.
 */
export class UserNotFoundError extends Error {
  readonly code = 'USER_NOT_FOUND'

  constructor() {
    super('user was not found')
    this.name = new.target.name
  }
}
