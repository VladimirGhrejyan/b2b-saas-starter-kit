import type {OnModuleDestroy} from '@nestjs/common'
import {Inject, Injectable} from '@nestjs/common'
import type {Dispatcher} from 'undici'
import {Agent, EnvHttpProxyAgent} from 'undici'

import type {HttpClientConfig} from '../config/http-client-config'
import {HTTP_CLIENT_CONFIG} from '../tokens'

/**
 * Owns the process-wide undici dispatcher. Scoped clients share this instance.
 */
@Injectable()
export class HttpClientAgentManager implements OnModuleDestroy {
  readonly #dispatcher: Dispatcher

  constructor(@Inject(HTTP_CLIENT_CONFIG) config: HttpClientConfig) {
    this.#dispatcher =
      config.HTTPS_PROXY === undefined
        ? new Agent({
            connections: config.HTTP_CLIENT_POOL_MAX,
            connect: {timeout: config.HTTP_CLIENT_CONNECT_TIMEOUT_MS},
            keepAliveTimeout: 10_000,
            keepAliveMaxTimeout: 30_000,
          })
        : new EnvHttpProxyAgent({
            httpProxy: config.HTTPS_PROXY,
            httpsProxy: config.HTTPS_PROXY,
            noProxy: config.NO_PROXY,
          })
  }

  get(): Dispatcher {
    return this.#dispatcher
  }

  async onModuleDestroy(): Promise<void> {
    await this.#dispatcher.close()
  }
}
