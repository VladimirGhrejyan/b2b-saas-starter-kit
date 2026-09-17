import {Module} from '@nestjs/common'

import {ConfigLoader} from '@b2b-saas-starter-kit/config'

import {WORKER_OUTBOX_CONFIG, WorkerModule, type WorkerOutboxConfig} from '@b2b-saas-starter-kit/composition'

import {type WorkerEnv, WorkerEnvSchema} from '../config/env.schema'
import {WORKER_ENV} from '../config/worker-env.token'

@Module({
  imports: [WorkerModule],
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
            'OUTBOX_POLL_INTERVAL_MS',
            'OUTBOX_BATCH_SIZE',
            'LOG_LEVEL',
            'LOG_PRETTY',
          ],
        }),
    },
    {
      provide: WORKER_OUTBOX_CONFIG,
      useFactory: (env: WorkerEnv): WorkerOutboxConfig => ({
        pollIntervalMs: env.OUTBOX_POLL_INTERVAL_MS,
        batchSize: env.OUTBOX_BATCH_SIZE,
      }),
      inject: [WORKER_ENV],
    },
  ],
})
export class AppModule {}
