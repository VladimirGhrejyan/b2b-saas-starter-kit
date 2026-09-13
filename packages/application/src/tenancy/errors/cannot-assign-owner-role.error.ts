/**
 * Thrown when invite, attach, or replace-roles tries to assign the Owner system role.
 */
export class CannotAssignOwnerRoleError extends Error {
  readonly code = 'CANNOT_ASSIGN_OWNER_ROLE'

  constructor() {
    super('the Owner role cannot be assigned after tenant creation')
    this.name = new.target.name
  }
}
