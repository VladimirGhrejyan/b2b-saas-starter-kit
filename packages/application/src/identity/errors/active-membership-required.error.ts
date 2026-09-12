/**
 * Thrown when select-tenant is called without an active membership.
 */
export class ActiveMembershipRequiredError extends Error {
  readonly code = 'ACTIVE_MEMBERSHIP_REQUIRED'

  constructor() {
    super('active membership is required')
    this.name = new.target.name
  }
}
