/**
 * Thrown when a suspended user attempts to sign in.
 */
export class UserSuspendedError extends Error {
  readonly code = 'USER_SUSPENDED'

  constructor() {
    super('user is suspended')
    this.name = new.target.name
  }
}
