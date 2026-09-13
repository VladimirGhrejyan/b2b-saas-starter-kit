/**
 * Thrown when deleting a custom role that is still assigned to a membership.
 */
export class RoleInUseError extends Error {
  readonly code = 'ROLE_IN_USE'

  constructor() {
    super('role is still assigned to a membership')
    this.name = new.target.name
  }
}
