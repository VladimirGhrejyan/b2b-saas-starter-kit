/**
 * Thrown when the user already has a membership in the tenant.
 */
export class MembershipAlreadyExistsError extends Error {
  readonly code = 'MEMBERSHIP_ALREADY_EXISTS'

  constructor() {
    super('user already has a membership in this tenant')
    this.name = new.target.name
  }
}
