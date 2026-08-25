import {ConfigLoader} from '@b2b-saas-starter-kit/config'

import type {PostgresConfig} from './postgres-config'
import {postgresConfigSchema} from './postgres-config'

/**
 * Loads {@link PostgresConfig} from the environment. Call from bootstrap or CLI — not at import time.
 */
export function loadPostgresConfigFromEnv(env: Record<string, string | undefined> = process.env): PostgresConfig {
  return ConfigLoader.load(postgresConfigSchema, {
    source: 'env',
    keys: [
      'DATABASE_URL',
      'POSTGRES_POOL_MAX',
      'POSTGRES_CONNECT_TIMEOUT_MS',
      'POSTGRES_STATEMENT_TIMEOUT_MS',
      'POSTGRES_LOCK_TIMEOUT_MS',
      'POSTGRES_IDLE_IN_TX_TIMEOUT_MS',
      'POSTGRES_APPLICATION_NAME',
      'POSTGRES_SLOW_QUERY_MS',
    ],
    env,
  })
}
