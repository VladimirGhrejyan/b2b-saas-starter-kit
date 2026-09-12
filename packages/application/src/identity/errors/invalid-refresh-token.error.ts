/**
 * Thrown when a refresh cookie is missing, expired, reused, or unknown.
 */
export class InvalidRefreshTokenError extends Error {
  readonly code = 'INVALID_REFRESH_TOKEN'

  constructor() {
    super('refresh token is invalid')
    this.name = new.target.name
  }
}
