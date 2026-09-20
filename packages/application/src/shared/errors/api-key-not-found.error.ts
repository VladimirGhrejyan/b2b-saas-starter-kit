/**
 * Thrown when an API key id is unknown in the tenant.
 */
export class ApiKeyNotFoundError extends Error {
  readonly code = 'API_KEY_NOT_FOUND'

  constructor() {
    super('API key was not found')
    this.name = new.target.name
  }
}
