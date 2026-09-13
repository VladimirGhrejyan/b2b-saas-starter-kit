import {
  DEV_JWT_ACCESS_SECRET,
  JWT_ACCESS_TTL_SECONDS,
  JWT_AUDIENCE,
  JWT_ISSUER,
  JWT_NODE_ENVS,
} from './jwt-access.constants'
import type {JwtAccessConfig} from './jwt-access.types'

/**
 * Reads JWT and refresh-cookie settings from process env.
 */
export function loadJwtAccessConfigFromEnv(): JwtAccessConfig {
  const nodeEnv = JWT_NODE_ENVS.includes(process.env.NODE_ENV as JwtAccessConfig['nodeEnv'])
    ? (process.env.NODE_ENV as JwtAccessConfig['nodeEnv'])
    : 'development'
  const ttlRaw = process.env.JWT_ACCESS_TTL_SECONDS
  const ttlSeconds = ttlRaw === undefined ? JWT_ACCESS_TTL_SECONDS : Number(ttlRaw)

  return {
    secret: process.env.JWT_ACCESS_SECRET ?? DEV_JWT_ACCESS_SECRET,
    ttlSeconds: Number.isInteger(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : JWT_ACCESS_TTL_SECONDS,
    issuer: process.env.JWT_ISSUER ?? JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE ?? JWT_AUDIENCE,
    nodeEnv,
    cookieSecure: nodeEnv === 'production' && process.env.API_PLAIN_HTTP !== 'true',
  }
}
