/**
 * Thrown when a custom role name already exists in the tenant.
 */
export class RoleNameTakenError extends Error {
  readonly code = 'ROLE_NAME_TAKEN'

  constructor() {
    super('a role with this name already exists in the tenant')
    this.name = new.target.name
  }
}
