import {type DynamicModule, Module} from '@nestjs/common'

import {
  CompositionInfraConfigMapper,
  RuntimeConfigModule,
  toCompositionRuntimeConfig,
  WorkerModule,
  type WorkerRuntimeConfig,
} from '@b2b-saas-starter-kit/composition'

import type {WorkerConfig} from '../config/worker-config.schema'
import {WORKER_CONFIG} from '../config/worker-config.token'

@Module({})
export class AppModule {
  static forRoot(config: WorkerConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        RuntimeConfigModule.forRoot(
          toCompositionRuntimeConfig({
            postgres: config.postgres,
            redis: config.redis,
            mail: config.mail,
          }),
        ),
        WorkerModule.forRootAsync({
          useFactory: (): WorkerRuntimeConfig => ({
            postgres: CompositionInfraConfigMapper.postgres(config.postgres),
            messaging: {REDIS_URL: config.redis.url, BULLMQ_PREFIX: config.messaging.prefix},
            outbox: {
              pollIntervalMs: config.outbox.pollIntervalMs,
              batchSize: config.outbox.batchSize,
            },
            maintenance: {
              refreshSessionsEveryMs: config.maintenance.refreshSessionsEveryMs,
              passwordResetTokensEveryMs: config.maintenance.passwordResetTokensEveryMs,
              staleInvitationsEveryMs: config.maintenance.staleInvitationsEveryMs,
              reclaimStaleOutboxEveryMs: config.maintenance.reclaimStaleOutboxEveryMs,
              staleProcessingMs: config.outbox.staleProcessingMs,
            },
          }),
        }),
      ],
      providers: [{provide: WORKER_CONFIG, useValue: config}],
    }
  }
}
