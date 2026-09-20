import type {InjectionToken} from '@nestjs/common'

import type {WorkerMaintenanceConfig} from './worker-maintenance-config.token'
import type {WorkerOutboxConfig} from './worker-outbox-config.token'

export type WorkerRuntimeConfig = {
  readonly outbox: WorkerOutboxConfig
  readonly maintenance: WorkerMaintenanceConfig
}

export type WorkerModuleAsyncOptions<TArgs extends unknown[] = unknown[]> = {
  readonly useFactory: (...args: TArgs) => WorkerRuntimeConfig | Promise<WorkerRuntimeConfig>
  readonly inject?: InjectionToken[]
}
