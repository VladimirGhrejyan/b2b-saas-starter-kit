/**
 * Thrown when role replacement would leave the tenant with no active Owner.
 */
export class LastOwnerRequiredError extends Error {
  readonly code = 'LAST_OWNER_REQUIRED'

  constructor() {
    super('a tenant must keep at least one active Owner membership')
    this.name = new.target.name
  }
}
