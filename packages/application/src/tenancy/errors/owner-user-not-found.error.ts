/**
 * Thrown when {@link CreateTenantUseCase} is given an unknown owner user id.
 */
export class OwnerUserNotFoundError extends Error {
  readonly code = 'OWNER_USER_NOT_FOUND'

  constructor() {
    super('owner user was not found')
    this.name = new.target.name
  }
}
