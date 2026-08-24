import type {InjectionToken} from '@nestjs/common'

import type {PostgresConfig} from '../config/postgres-config'

export type PostgresInfrastructureModuleAsyncOptions = {
  readonly useFactory: (...args: unknown[]) => PostgresConfig | Promise<PostgresConfig>
  readonly inject?: InjectionToken[]
}
