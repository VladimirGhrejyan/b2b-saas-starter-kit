import type {InjectionToken} from '@nestjs/common'

import type {HttpClientConfig} from './config/http-client-config'

export type HttpClientModuleAsyncOptions = {
  readonly useFactory: (...args: unknown[]) => HttpClientConfig | Promise<HttpClientConfig>
  readonly inject?: InjectionToken[]
}
