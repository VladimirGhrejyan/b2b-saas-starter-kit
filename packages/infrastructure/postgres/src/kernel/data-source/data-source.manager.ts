import type {OnModuleDestroy, OnModuleInit} from '@nestjs/common'
import {Inject, Injectable} from '@nestjs/common'
import type {DataSource} from 'typeorm'

import type {PostgresConfig} from '../config/postgres-config'
import {POSTGRES_CONFIG} from '../tokens'

import {createDataSource} from './create-data-source'

/**
 * Owns TypeORM {@link DataSource} initialize/destroy. Constructable without Nest for tests.
 */
@Injectable()
export class DataSourceManager implements OnModuleInit, OnModuleDestroy {
  readonly #dataSource: DataSource

  constructor(@Inject(POSTGRES_CONFIG) config: PostgresConfig) {
    this.#dataSource = createDataSource(config)
  }

  async onModuleInit(): Promise<void> {
    if (!this.#dataSource.isInitialized) {
      await this.#dataSource.initialize()
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.#dataSource.isInitialized) {
      await this.#dataSource.destroy()
    }
  }

  get(): DataSource {
    return this.#dataSource
  }
}
