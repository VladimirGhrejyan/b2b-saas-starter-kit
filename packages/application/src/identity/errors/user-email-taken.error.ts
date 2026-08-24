/**
 * Thrown when {@link CreateUserUseCase} is given an email that already exists.
 */
export class UserEmailTakenError extends Error {
  readonly code = 'USER_EMAIL_TAKEN'

  constructor() {
    super('a user with this email already exists')
    this.name = new.target.name
  }
}
