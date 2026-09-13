/**
 * Thrown when a membership id is unknown in the tenant.
 */
export class MembershipNotFoundError extends Error {
  readonly code = 'MEMBERSHIP_NOT_FOUND'

  constructor() {
    super('membership was not found')
    this.name = new.target.name
  }
}
