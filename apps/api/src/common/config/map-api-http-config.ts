import type {ApiHttpConfig} from '@b2b-saas-starter-kit/nest-http'

import type {ApiConfig} from './api-config.schema'

/** Maps validated API config onto the nest-http bootstrap config. */
export function mapApiHttpConfig(config: ApiConfig): ApiHttpConfig {
  const isProduction = config.nodeEnv === 'production'
  const swagger = config.http.swagger
  const swaggerUser = swagger.basicAuth?.username
  const swaggerPassword = swagger.basicAuth?.password

  return {
    title: config.http.title,
    port: config.http.port,
    host: config.http.host,
    version: config.http.version,
    globalPrefix: config.http.globalPrefix,
    isProduction,
    isPlainHttp: config.http.plainHttp,
    corsOrigins: config.http.cors.origins,
    corsCredentials: config.http.cors.credentials,
    swagger: {
      enabled: swagger.enabled ?? !isProduction,
      path: swagger.path,
      basicAuth:
        swaggerUser !== undefined && swaggerPassword !== undefined
          ? {username: swaggerUser, password: swaggerPassword}
          : undefined,
    },
  }
}
