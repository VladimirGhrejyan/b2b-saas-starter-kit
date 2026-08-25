import {DataSource} from 'typeorm'

import 'reflect-metadata'

import type {PostgresConfig} from '../config/postgres-config'

import type {CreateDataSourceOptions} from './create-data-source.types'
import {postgresEntities} from './postgres-entities'
import {postgresMigrations} from './postgres-migrations'

/**
 * Builds a vanilla TypeORM {@link DataSource}. Does not connect; callers must `initialize()`.
 *
 * Extra `entities` are merged with the foundation set so tests can register probe tables.
 */
export function createDataSource(config: PostgresConfig, options: CreateDataSourceOptions = {}): DataSource {
  return new DataSource({
    type: 'postgres',
    url: config.DATABASE_URL,
    entities: [...postgresEntities, ...(options.entities ?? [])],
    migrations: options.migrations ?? postgresMigrations,
    migrationsRun: false,
    synchronize: false,
    logging: false,
    poolSize: config.POSTGRES_POOL_MAX,
    maxQueryExecutionTime: config.POSTGRES_SLOW_QUERY_MS,
    extra: {
      max: config.POSTGRES_POOL_MAX,
      connectionTimeoutMillis: config.POSTGRES_CONNECT_TIMEOUT_MS,
      statement_timeout: config.POSTGRES_STATEMENT_TIMEOUT_MS,
      lock_timeout: config.POSTGRES_LOCK_TIMEOUT_MS,
      idle_in_transaction_session_timeout: config.POSTGRES_IDLE_IN_TX_TIMEOUT_MS,
      application_name: config.POSTGRES_APPLICATION_NAME,
    },
  })
}
