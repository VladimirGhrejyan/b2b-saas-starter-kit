import type {InjectionToken} from '@nestjs/common'

import type {WorkerMaintenanceConfig} from './maintenance/worker-maintenance-config.token'
import type {WorkerOutboxConfig} from './outbox/worker-outbox-config.token'

export type WorkerRuntimeConfig = {
  readonly postgres: {readonly DATABASE_URL: string}
  readonly messaging: {readonly REDIS_URL: string; readonly BULLMQ_PREFIX?: string}
  readonly outbox: WorkerOutboxConfig
  readonly maintenance: WorkerMaintenanceConfig
}

export type WorkerModuleAsyncOptions<TArgs extends unknown[] = unknown[]> = {
  readonly useFactory: (...args: TArgs) => WorkerRuntimeConfig | Promise<WorkerRuntimeConfig>
  readonly inject?: InjectionToken[]
}
