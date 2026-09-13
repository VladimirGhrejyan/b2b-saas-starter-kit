/**
 * Thrown when a tenant id is unknown.
 */
export class TenantNotFoundError extends Error {
  readonly code = 'TENANT_NOT_FOUND'

  constructor() {
    super('tenant was not found')
    this.name = new.target.name
  }
}
