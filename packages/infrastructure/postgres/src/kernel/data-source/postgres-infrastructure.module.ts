import type {DynamicModule} from '@nestjs/common'
import {Module} from '@nestjs/common'

import {SystemClock} from '../clock/clock'
import {UuidV7IdGenerator} from '../id-generator/id-generator'
import {TypeormUnitOfWork} from '../persistence/unit-of-work'
import {AlsTenantContext} from '../tenant-context/tenant-context'
import {CLOCK, DATA_SOURCE, ID_GENERATOR, POSTGRES_CONFIG, TENANT_CONTEXT, UNIT_OF_WORK} from '../tokens'

import {DataSourceManager} from './data-source.manager'
import type {PostgresInfrastructureModuleAsyncOptions} from './postgres-infrastructure.module.types'

/**
 * Nest wrapper around a vanilla TypeORM {@link DataSource}. Do not use `TypeOrmModule`.
 */
@Module({})
export class PostgresInfrastructureModule {
  static forRootAsync(options: PostgresInfrastructureModuleAsyncOptions): DynamicModule {
    return {
      module: PostgresInfrastructureModule,
      global: true,
      providers: [
        {
          provide: POSTGRES_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        DataSourceManager,
        {
          provide: DATA_SOURCE,
          useFactory: (manager: DataSourceManager) => manager.get(),
          inject: [DataSourceManager],
        },
        AlsTenantContext,
        {
          provide: TENANT_CONTEXT,
          useExisting: AlsTenantContext,
        },
        TypeormUnitOfWork,
        {
          provide: UNIT_OF_WORK,
          useExisting: TypeormUnitOfWork,
        },
        SystemClock,
        {
          provide: CLOCK,
          useExisting: SystemClock,
        },
        UuidV7IdGenerator,
        {
          provide: ID_GENERATOR,
          useExisting: UuidV7IdGenerator,
        },
      ],
      exports: [
        POSTGRES_CONFIG,
        DataSourceManager,
        DATA_SOURCE,
        AlsTenantContext,
        TENANT_CONTEXT,
        TypeormUnitOfWork,
        UNIT_OF_WORK,
        SystemClock,
        CLOCK,
        UuidV7IdGenerator,
        ID_GENERATOR,
      ],
    }
  }
}
