import type {DynamicModule} from '@nestjs/common'
import {Module} from '@nestjs/common'

import {
  PurgePasswordResetTokensUseCase,
  PurgeRefreshSessionsUseCase,
  PurgeStaleInvitationsUseCase,
} from '@b2b-saas-starter-kit/application'

import {loadPostgresConfigFromEnv, PostgresInfrastructureModule} from '@b2b-saas-starter-kit/postgres'
import {NodeInfrastructureModule} from '@b2b-saas-starter-kit/node'
import {loadMessagingConfigFromEnv, MessagingInfrastructureModule} from '@b2b-saas-starter-kit/messaging'

import {IdentityModule} from '../identity/identity.module'
import {TenancyModule} from '../tenancy/tenancy.module'

import {DomainEventLoggingHandler} from './domain-event-logging.handler'
import {DomainEventSubscriptionRegistrar} from './domain-event-subscription.registrar'
import {MaintenanceProcessorService} from './maintenance-processor.service'
import {MaintenanceScheduler} from './maintenance-scheduler'
import {OutboxEventProcessorService} from './outbox-event-processor.service'
import {OutboxRelayService} from './outbox-relay.service'
import type {WorkerModuleAsyncOptions} from './worker.module.types'
import {WORKER_MAINTENANCE_CONFIG} from './worker-maintenance-config.token'
import {WORKER_OUTBOX_CONFIG} from './worker-outbox-config.token'

@Module({})
export class WorkerModule {
  static forRootAsync<TArgs extends unknown[]>(options: WorkerModuleAsyncOptions<TArgs>): DynamicModule {
    return {
      module: WorkerModule,
      imports: [
        PostgresInfrastructureModule.forRootAsync({
          useFactory: () => loadPostgresConfigFromEnv(),
        }),
        NodeInfrastructureModule,
        IdentityModule,
        TenancyModule,
        MessagingInfrastructureModule.forRootAsync({
          useFactory: () => loadMessagingConfigFromEnv(),
        }),
      ],
      providers: [
        {
          provide: WORKER_OUTBOX_CONFIG,
          useFactory: async (...args: TArgs) => (await options.useFactory(...args)).outbox,
          inject: options.inject ?? [],
        },
        {
          provide: WORKER_MAINTENANCE_CONFIG,
          useFactory: async (...args: TArgs) => (await options.useFactory(...args)).maintenance,
          inject: options.inject ?? [],
        },
        DomainEventLoggingHandler,
        DomainEventSubscriptionRegistrar,
        OutboxRelayService,
        OutboxEventProcessorService,
        PurgeRefreshSessionsUseCase,
        PurgePasswordResetTokensUseCase,
        PurgeStaleInvitationsUseCase,
        MaintenanceScheduler,
        MaintenanceProcessorService,
      ],
      exports: [OutboxRelayService],
    }
  }
}
