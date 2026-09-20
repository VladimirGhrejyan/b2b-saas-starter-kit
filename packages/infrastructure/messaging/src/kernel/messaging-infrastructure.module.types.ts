import type {InjectionToken} from '@nestjs/common'

import type {MessagingConfig} from './config/messaging-config'

export type MessagingInfrastructureModuleAsyncOptions = {
  readonly useFactory: (...args: unknown[]) => MessagingConfig | Promise<MessagingConfig>
  readonly inject?: InjectionToken[]
}
