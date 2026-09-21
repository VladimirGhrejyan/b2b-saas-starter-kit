import type {AuthBootstrapInput} from './assert-auth-bootstrap.types'
import {DEV_JWT_ACCESS_SECRET} from './jwt-access.constants'

/**
 * Staging and production must have a real JWT secret and CORS origins.
 * Header-trust is never the only auth path.
 */
export function assertAuthBootstrap(input: AuthBootstrapInput): void {
  if (input.jwtAccessSecret.length === 0) {
    throw new Error('JWT_ACCESS_SECRET is required')
  }

  const isDeployedSurface =
    input.nodeEnv === 'production' || input.appEnv === 'staging' || input.appEnv === 'production'

  if (isDeployedSurface && input.jwtAccessSecret === DEV_JWT_ACCESS_SECRET) {
    throw new Error('JWT_ACCESS_SECRET must not be the development default in production or staging')
  }

  if (input.appEnv !== 'development' && input.corsOrigins.length === 0) {
    throw new Error('http.cors.origins must be non-empty when appEnv is not development')
  }
}
