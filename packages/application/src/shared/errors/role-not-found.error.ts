/**
 * Thrown when a role id is unknown in the tenant.
 */
export class RoleNotFoundError extends Error {
  readonly code = 'ROLE_NOT_FOUND'

  constructor() {
    super('role was not found')
    this.name = new.target.name
  }
}
