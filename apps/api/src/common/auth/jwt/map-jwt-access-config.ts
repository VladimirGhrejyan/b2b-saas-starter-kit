import type {ApiConfig} from '../../config/api-config.schema'

import type {JwtAccessConfig} from './jwt-access.types'

export function mapJwtAccessConfig(config: ApiConfig): JwtAccessConfig {
  return {
    secret: config.jwt.accessSecret,
    ttlSeconds: config.jwt.ttlSeconds,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
    nodeEnv: config.nodeEnv,
    cookieSecure: config.nodeEnv === 'production' && !config.http.plainHttp,
    cookiePath: config.http.refreshCookiePath,
  }
}
