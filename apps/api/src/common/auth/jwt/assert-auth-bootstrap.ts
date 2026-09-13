import {DEV_JWT_ACCESS_SECRET} from './jwt-access.constants'

/**
 * Production must have a real JWT secret. Header-trust is never the only auth path.
 */
export function assertAuthBootstrap(nodeEnv: string, jwtAccessSecret: string): void {
  if (jwtAccessSecret.length === 0) {
    throw new Error('JWT_ACCESS_SECRET is required')
  }

  if (nodeEnv === 'production' && jwtAccessSecret === DEV_JWT_ACCESS_SECRET) {
    throw new Error('JWT_ACCESS_SECRET must not be the development default in production')
  }
}
