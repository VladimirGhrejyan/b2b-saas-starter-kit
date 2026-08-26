import type {ApiHttpConfig} from '@b2b-saas-starter-kit/nest-http'

import type {ApiEnv} from './env.schema'

/** Maps validated process env onto the nest-http bootstrap config. */
export function mapApiHttpConfig(env: ApiEnv): ApiHttpConfig {
  const isProduction = env.NODE_ENV === 'production'
  const swaggerUser = env.SWAGGER_BASIC_AUTH_USER
  const swaggerPassword = env.SWAGGER_BASIC_AUTH_PASSWORD

  return {
    title: env.API_TITLE,
    port: env.PORT,
    host: env.API_HOST,
    version: env.API_VERSION,
    globalPrefix: env.API_GLOBAL_PREFIX,
    isProduction,
    isPlainHttp: env.API_PLAIN_HTTP === 'true',
    corsOrigins: env.CORS_ORIGINS
      ? env.CORS_ORIGINS.split(',')
          .map((origin) => origin.trim())
          .filter((origin) => origin.length > 0)
      : [],
    corsCredentials: env.CORS_CREDENTIALS === 'true',
    swagger: {
      enabled: env.SWAGGER_ENABLED ? env.SWAGGER_ENABLED === 'true' : !isProduction,
      path: env.SWAGGER_PATH,
      basicAuth:
        swaggerUser !== undefined && swaggerPassword !== undefined
          ? {username: swaggerUser, password: swaggerPassword}
          : undefined,
    },
  }
}
