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
  })
}
