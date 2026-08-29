import type {HttpClientPort, HttpClientScope, HttpRequest, HttpResponse} from '@b2b-saas-starter-kit/platform'
import {HttpTimeoutRequiredError} from '@b2b-saas-starter-kit/platform'

import type {InMemoryHttpClientOptions, InMemoryHttpClientStore} from './in-memory-http-client.types'

/**
 * In-memory {@link HttpClientPort} for application unit tests.
 */
export class InMemoryHttpClient implements HttpClientPort {
  readonly #store: InMemoryHttpClientStore

  readonly #defaults: HttpClientScope | undefined

  constructor(options: InMemoryHttpClientOptions = {}) {
    this.#store = options.store ?? {requests: [], stubs: new Map()}
    this.#defaults = options.defaults
  }

  get requests(): readonly HttpRequest[] {
    return this.#store.requests
  }

  stub(method: string, url: string, response: HttpResponse): void {
    this.#store.stubs.set(`${method} ${url}`, response)
  }

  request(req: HttpRequest): Promise<HttpResponse> {
    const timeoutMs = req.timeoutMs ?? this.#defaults?.timeoutMs

    if (timeoutMs === undefined) {
      return Promise.reject(new HttpTimeoutRequiredError())
    }

    const merged: HttpRequest = {
      ...req,
      url: this.#resolveUrl(req.url),
      headers: {...this.#defaults?.headers, ...req.headers},
      timeoutMs,
      retry: req.retry ?? this.#defaults?.retry,
    }

    this.#store.requests.push(merged)

    return Promise.resolve(
      this.#store.stubs.get(`${merged.method} ${merged.url}`) ?? {status: 200, headers: {}, body: null},
    )
  }

  scope(defaults: HttpClientScope): HttpClientPort {
    return new InMemoryHttpClient({
      store: this.#store,
      defaults: {
        name: defaults.name,
        baseUrl: defaults.baseUrl ?? this.#defaults?.baseUrl,
        headers: {...this.#defaults?.headers, ...defaults.headers},
        timeoutMs: defaults.timeoutMs ?? this.#defaults?.timeoutMs,
        retry: defaults.retry ?? this.#defaults?.retry,
      },
    })
  }

  #resolveUrl(url: string): string {
    const baseUrl = this.#defaults?.baseUrl

    if (baseUrl === undefined || url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }

    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    const path = url.startsWith('/') ? url : `/${url}`

    return `${base}${path}`
  }
}
