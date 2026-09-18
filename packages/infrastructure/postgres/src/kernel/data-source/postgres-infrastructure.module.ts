import type {DynamicModule} from '@nestjs/common'
import {Module} from '@nestjs/common'

import {
  EVENT_BUS,
  EVENT_PUBLISHER,
  IDEMPOTENCY,
  InProcessEventBus,
  TENANT_CONTEXT,
  UNIT_OF_WORK,
} from '@b2b-saas-starter-kit/platform'

import {PostgresIdempotencyStore} from '../idempotency/postgres-idempotency.store'
import {OutboxRelay} from '../outbox/outbox-relay'
import {PostgresEventPublisher} from '../outbox/postgres-event-publisher'
import {TypeormUnitOfWork} from '../persistence/unit-of-work'
import {AlsTenantContext} from '../tenant-context/tenant-context'
import {DATA_SOURCE, POSTGRES_CONFIG} from '../tokens'

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
        InProcessEventBus,
        {
          provide: EVENT_BUS,
          useExisting: InProcessEventBus,
        },
        PostgresEventPublisher,
        {
          provide: EVENT_PUBLISHER,
          useExisting: PostgresEventPublisher,
        },
        PostgresIdempotencyStore,
        {
          provide: IDEMPOTENCY,
          useExisting: PostgresIdempotencyStore,
        },
        OutboxRelay,
      ],
      exports: [
        POSTGRES_CONFIG,
        DataSourceManager,
        DATA_SOURCE,
        AlsTenantContext,
        TENANT_CONTEXT,
        TypeormUnitOfWork,
        UNIT_OF_WORK,
        EVENT_BUS,
        EVENT_PUBLISHER,
        IDEMPOTENCY,
        OutboxRelay,
      ],
    }
  }
}
