import type {DynamicModule} from '@nestjs/common'
import {Module} from '@nestjs/common'

import {UndiciHttpClient} from '../http-client.adapter'

import type {HttpClientConfig} from './config/http-client-config'
import {HttpClientAgentManager} from './connection/http-client-agent.manager'
import type {HttpClientModuleAsyncOptions} from './http-client.module.types'
import {HTTP_CLIENT, HTTP_CLIENT_CONFIG} from './tokens'

/**
 * Nest wrapper around one process-wide undici Agent and {@link UndiciHttpClient}.
 */
@Module({})
export class HttpClientModule {
  static forRootAsync(options: HttpClientModuleAsyncOptions): DynamicModule {
    return {
      module: HttpClientModule,
      global: true,
      providers: [
        {
          provide: HTTP_CLIENT_CONFIG,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        HttpClientAgentManager,
        {
          provide: UndiciHttpClient,
          useFactory: (manager: HttpClientAgentManager, config: HttpClientConfig) =>
            new UndiciHttpClient(manager.get(), config),
          inject: [HttpClientAgentManager, HTTP_CLIENT_CONFIG],
        },
        {
          provide: HTTP_CLIENT,
          useExisting: UndiciHttpClient,
        },
      ],
      exports: [HTTP_CLIENT_CONFIG, UndiciHttpClient, HTTP_CLIENT],
    }
  }
}
