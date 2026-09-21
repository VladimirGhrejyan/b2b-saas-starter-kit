import type {DynamicModule} from '@nestjs/common'
import {Module} from '@nestjs/common'

import {
  PurgePasswordResetTokensUseCase,
  PurgeRefreshSessionsUseCase,
  PurgeStaleInvitationsUseCase,
} from '@b2b-saas-starter-kit/application'

import {postgresConfigSchema, PostgresInfrastructureModule} from '@b2b-saas-starter-kit/postgres'
import {NodeInfrastructureModule} from '@b2b-saas-starter-kit/node'
import {messagingConfigSchema, MessagingInfrastructureModule} from '@b2b-saas-starter-kit/messaging'

import {IdentityModule} from '../identity/identity.module'
import {TenancyModule} from '../tenancy/tenancy.module'

import {DomainEventLoggingHandler} from './events/domain-event-logging.handler'
import {DomainEventSubscriptionRegistrar} from './events/domain-event-subscription.registrar'
import {MaintenanceProcessorService} from './maintenance/maintenance-processor.service'
import {MaintenanceScheduler} from './maintenance/maintenance-scheduler'
import {WORKER_MAINTENANCE_CONFIG} from './maintenance/worker-maintenance-config.token'
import {OutboxEventProcessorService} from './outbox/outbox-event-processor.service'
import {OutboxRelayService} from './outbox/outbox-relay.service'
import {WORKER_OUTBOX_CONFIG} from './outbox/worker-outbox-config.token'
import type {WorkerModuleAsyncOptions} from './worker.module.types'

@Module({})
export class WorkerModule {
  static forRootAsync<TArgs extends unknown[]>(options: WorkerModuleAsyncOptions<TArgs>): DynamicModule {
    return {
      module: WorkerModule,
      imports: [
        PostgresInfrastructureModule.forRootAsync({
          inject: options.inject ?? [],
          useFactory: async (...args: unknown[]) =>
            postgresConfigSchema.parse((await options.useFactory(...(args as TArgs))).postgres),
        }),
        NodeInfrastructureModule,
        IdentityModule,
        TenancyModule,
        MessagingInfrastructureModule.forRootAsync({
          inject: options.inject ?? [],
          useFactory: async (...args: unknown[]) =>
            messagingConfigSchema.parse((await options.useFactory(...(args as TArgs))).messaging),
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
