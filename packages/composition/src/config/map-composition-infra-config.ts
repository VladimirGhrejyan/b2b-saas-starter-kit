import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

import {type PostgresConfig, postgresConfigSchema} from '@b2b-saas-starter-kit/postgres'
import {type RedisConfig, redisConfigSchema} from '@b2b-saas-starter-kit/redis'
import {httpClientConfigSchema} from '@b2b-saas-starter-kit/http-client'
import {
  type HttpMailerConfig,
  httpMailerConfigSchema,
  type SmtpConfig,
  smtpConfigSchema,
} from '@b2b-saas-starter-kit/mail'

import type {
  CompositionHttpClientSlice,
  CompositionHttpMailSlice,
  CompositionPostgresSlice,
  CompositionRedisSlice,
  CompositionSmtpMailSlice,
} from './composition-runtime-config.types'

export class CompositionInfraConfigMapper {
  static postgres(slice: CompositionPostgresSlice): PostgresConfig {
    return postgresConfigSchema.parse({
      DATABASE_URL: slice.url,
      POSTGRES_POOL_MAX: slice.poolMax,
      POSTGRES_CONNECT_TIMEOUT_MS: slice.connectTimeoutMs,
      POSTGRES_STATEMENT_TIMEOUT_MS: slice.statementTimeoutMs,
      POSTGRES_LOCK_TIMEOUT_MS: slice.lockTimeoutMs,
      POSTGRES_IDLE_IN_TX_TIMEOUT_MS: slice.idleInTxTimeoutMs,
      POSTGRES_APPLICATION_NAME: slice.applicationName,
      POSTGRES_SLOW_QUERY_MS: slice.slowQueryMs,
    })
  }

  static redis(slice: CompositionRedisSlice): RedisConfig {
    return redisConfigSchema.parse({
      REDIS_URL: slice.url,
      REDIS_KEY_PREFIX: slice.keyPrefix,
    })
  }

  static httpClient(slice: CompositionHttpClientSlice | undefined) {
    return httpClientConfigSchema.parse({
      HTTP_CLIENT_TIMEOUT_MS: slice?.timeoutMs,
      HTTP_CLIENT_CONNECT_TIMEOUT_MS: slice?.connectTimeoutMs,
      HTTP_CLIENT_POOL_MAX: slice?.poolMax,
      HTTP_CLIENT_MAX_RESPONSE_BYTES: slice?.maxResponseBytes,
      HTTP_CLIENT_USER_AGENT: slice?.userAgent,
      HTTP_CLIENT_MAX_REDIRECTS: slice?.maxRedirects,
      HTTPS_PROXY: slice?.httpsProxy,
      NO_PROXY: slice?.noProxy,
    })
  }

  static smtp(slice: CompositionSmtpMailSlice): SmtpConfig {
    return smtpConfigSchema.parse({
      SMTP_HOST: slice.host,
      SMTP_PORT: slice.port,
      SMTP_FROM: slice.from,
      SMTP_USER: slice.user,
      SMTP_PASS: slice.pass,
      SMTP_SECURE: TypeScriptUtils.isNil(slice.secure) ? undefined : slice.secure ? 'true' : 'false',
    })
  }

  static httpMail(slice: CompositionHttpMailSlice): HttpMailerConfig {
    return httpMailerConfigSchema.parse({
      url: slice.url,
      from: slice.from,
      apiKey: slice.apiKey,
    })
  }
}
