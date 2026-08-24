import {DataSource} from 'typeorm'

import type {PostgresConfig} from '../config/postgres-config'

import type {CreateDataSourceOptions} from './create-data-source.types'

/**
 * Builds a vanilla TypeORM {@link DataSource}. Does not connect; callers must `initialize()`.
 */
export function createDataSource(config: PostgresConfig, options: CreateDataSourceOptions = {}): DataSource {
  return new DataSource({
    type: 'postgres',
    url: config.DATABASE_URL,
    entities: options.entities ?? [],
    migrations: options.migrations ?? [],
    migrationsRun: false,
    synchronize: false,
    logging: false,
  })
}
