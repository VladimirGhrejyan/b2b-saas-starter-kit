import {Module} from '@nestjs/common'

import {ConfigLoader} from '@b2b-saas-starter-kit/config'

import {WorkerModule, type WorkerRuntimeConfig} from '@b2b-saas-starter-kit/composition'

import {type WorkerEnv, WorkerEnvSchema} from '../config/env.schema'
import {WORKER_ENV} from '../config/worker-env.token'

@Module({
  imports: [
    WorkerModule.forRootAsync({
      inject: [WORKER_ENV],
      useFactory: (env: WorkerEnv): WorkerRuntimeConfig => ({
        outbox: {
          pollIntervalMs: env.OUTBOX_POLL_INTERVAL_MS,
          batchSize: env.OUTBOX_BATCH_SIZE,
        },
        maintenance: {
          refreshSessionsEveryMs: env.PURGE_REFRESH_SESSIONS_EVERY_MS,
          passwordResetTokensEveryMs: env.PURGE_PASSWORD_RESET_TOKENS_EVERY_MS,
          staleInvitationsEveryMs: env.PURGE_STALE_INVITATIONS_EVERY_MS,
          reclaimStaleOutboxEveryMs: env.RECLAIM_STALE_OUTBOX_EVERY_MS,
          staleProcessingMs: env.OUTBOX_STALE_PROCESSING_MS,
        },
      }),
    }),
  ],
  providers: [
    {
      provide: WORKER_ENV,
      useFactory: (): WorkerEnv =>
        ConfigLoader.load(WorkerEnvSchema, {
          source: 'env',
          keys: [
            'APP_TYPE',
            'NODE_ENV',
            'DATABASE_URL',
            'REDIS_URL',
            'BULLMQ_PREFIX',
            'OUTBOX_POLL_INTERVAL_MS',
            'OUTBOX_BATCH_SIZE',
            'OUTBOX_STALE_PROCESSING_MS',
            'PURGE_REFRESH_SESSIONS_EVERY_MS',
            'PURGE_PASSWORD_RESET_TOKENS_EVERY_MS',
            'PURGE_STALE_INVITATIONS_EVERY_MS',
            'RECLAIM_STALE_OUTBOX_EVERY_MS',
            'LOG_LEVEL',
            'LOG_PRETTY',
            'TELEMETRY_ENABLED',
            'OTEL_EXPORTER_OTLP_ENDPOINT',
            'OTEL_SERVICE_NAME',
          ],
        }),
    },
  ],
})
export class AppModule {}
