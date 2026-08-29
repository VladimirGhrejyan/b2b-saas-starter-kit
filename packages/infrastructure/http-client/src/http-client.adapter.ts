import type {Dispatcher} from 'undici'
import {fetch} from 'undici'

import {
  HttpAbortedError,
  type HttpClientPort,
  type HttpClientScope,
  type HttpMethod,
  HttpNetworkError,
  type HttpRequest,
  type HttpResponse,
  HttpResponseTooLargeError,
  type HttpRetryPolicy,
  HttpTimeoutError,
  LoggerLocator,
  RequestContextLocator,
} from '@b2b-saas-starter-kit/platform'

import type {HttpClientConfig} from './kernel/config/http-client-config'

/**
 * undici-backed {@link HttpClientPort}. One dispatcher is shared; {@link scope} only changes defaults.
 */
export class UndiciHttpClient implements HttpClientPort {
  private static readonly defaultRetry: HttpRetryPolicy = {
    maxRetries: 2,
    retryOn: ['GET', 'HEAD', 'network', 'timeout', '429', '503'],
    backoffMs: {min: 50, max: 250},
  }

  private static readonly safeMethods = new Set<HttpMethod>(['GET', 'HEAD'])

  private static readonly redirectStatuses = new Set([301, 302, 303, 307, 308])

  private readonly defaults: HttpClientScope

  constructor(
    private readonly dispatcher: Dispatcher,
    private readonly config: HttpClientConfig,
    defaults: HttpClientScope = {name: 'http-client'},
  ) {
    this.defaults = {
      ...defaults,
      timeoutMs: defaults.timeoutMs ?? config.HTTP_CLIENT_TIMEOUT_MS,
    }
  }

  async request(req: HttpRequest): Promise<HttpResponse> {
    const timeoutMs = req.timeoutMs ?? this.defaults.timeoutMs ?? this.config.HTTP_CLIENT_TIMEOUT_MS
    const retry = this.#resolveRetry(req)
    const maxAttempts = 1 + (retry?.maxRetries ?? 0)

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const response = await this.#dispatch(req, timeoutMs)

        if (retry === undefined || attempt >= retry.maxRetries || !this.#shouldRetryStatus(response.status, retry)) {
          return response
        }

        await this.#backoff(retry)
      } catch (error) {
        if (retry === undefined || attempt >= retry.maxRetries || !this.#shouldRetryError(error, retry)) {
          throw error
        }

        await this.#backoff(retry)
      }
    }

    throw new HttpNetworkError()
  }

  scope(defaults: HttpClientScope): HttpClientPort {
    return new UndiciHttpClient(this.dispatcher, this.config, {
      name: defaults.name,
      baseUrl: defaults.baseUrl ?? this.defaults.baseUrl,
      headers: {...this.defaults.headers, ...defaults.headers},
      timeoutMs: defaults.timeoutMs ?? this.defaults.timeoutMs,
      retry: defaults.retry ?? this.defaults.retry,
    })
  }

  async #dispatch(req: HttpRequest, timeoutMs: number, redirectCount = 0): Promise<HttpResponse> {
    const url = this.#resolveUrl(req.url, req.query)
    const timeoutSignal = AbortSignal.timeout(timeoutMs)
    const signal = req.signal === undefined ? timeoutSignal : AbortSignal.any([timeoutSignal, req.signal])
    const started = Date.now()
    const host = new URL(url).host

    try {
      const response = await fetch(url, {
        method: req.method,
        headers: this.#buildHeaders(req),
        body: this.#encodeBody(req),
        redirect: 'manual',
        signal,
        dispatcher: this.dispatcher,
      })

      const followed = await this.#followRedirect(req, response, timeoutMs, redirectCount)

      if (followed !== undefined) {
        return followed
      }

      const parsed = await this.#readBody(response)

      this.#log(req.method, host, parsed.status, Date.now() - started)

      return parsed
    } catch (error) {
      this.#logFailure(req.method, host, Date.now() - started)
      this.#rethrow(error, timeoutSignal, req.signal)
    }
  }

  #buildHeaders(req: HttpRequest): Record<string, string> {
    const headers: Record<string, string> = {
      ...this.defaults.headers,
      ...req.headers,
    }

    if (!Object.hasOwn(headers, 'user-agent')) {
      headers['user-agent'] = this.config.HTTP_CLIENT_USER_AGENT
    }

    if (req.idempotencyKey !== undefined) {
      headers['idempotency-key'] = req.idempotencyKey
    }

    const requestId = RequestContextLocator.get()?.requestId

    if (requestId !== undefined && !Object.hasOwn(headers, 'x-request-id')) {
      headers['x-request-id'] = requestId
    }

    if (this.#isJsonBody(req.body) && !Object.hasOwn(headers, 'content-type')) {
      headers['content-type'] = 'application/json'
    }

    return headers
  }

  #encodeBody(req: HttpRequest): string | Uint8Array | undefined {
    if (req.body === undefined) {
      return undefined
    }

    if (typeof req.body === 'string' || req.body instanceof Uint8Array) {
      return req.body
    }

    return JSON.stringify(req.body)
  }

  #isJsonBody(body: unknown): boolean {
    return body !== undefined && typeof body !== 'string' && !(body instanceof Uint8Array)
  }

  async #readBody(response: Response): Promise<HttpResponse> {
    const contentLength = response.headers.get('content-length')

    if (contentLength !== null && Number(contentLength) > this.config.HTTP_CLIENT_MAX_RESPONSE_BYTES) {
      throw new HttpResponseTooLargeError(this.config.HTTP_CLIENT_MAX_RESPONSE_BYTES)
    }

    const buffer = await response.arrayBuffer()

    if (buffer.byteLength > this.config.HTTP_CLIENT_MAX_RESPONSE_BYTES) {
      throw new HttpResponseTooLargeError(this.config.HTTP_CLIENT_MAX_RESPONSE_BYTES)
    }

    const contentType = response.headers.get('content-type') ?? ''
    const raw = new TextDecoder().decode(buffer)
    const body = contentType.includes('application/json') && raw !== '' ? (JSON.parse(raw) as unknown) : raw
    const headers: Record<string, string> = {}

    response.headers.forEach((value, key) => {
      headers[key] = value
    })

    return {status: response.status, headers, body}
  }

  async #followRedirect(
    req: HttpRequest,
    response: Response,
    timeoutMs: number,
    redirectCount: number,
  ): Promise<HttpResponse | undefined> {
    if (!UndiciHttpClient.redirectStatuses.has(response.status) || !UndiciHttpClient.safeMethods.has(req.method)) {
      return undefined
    }

    const location = response.headers.get('location')

    if (location === null || redirectCount >= this.config.HTTP_CLIENT_MAX_REDIRECTS) {
      return undefined
    }

    const current = new URL(this.#resolveUrl(req.url, req.query))
    const next = new URL(location, current)

    if (next.host !== current.host) {
      return undefined
    }

    return this.#dispatch({...req, url: next.toString(), query: undefined}, timeoutMs, redirectCount + 1)
  }

  #resolveUrl(url: string, query?: HttpRequest['query']): string {
    const resolved = this.defaults.baseUrl === undefined ? new URL(url) : new URL(url, this.defaults.baseUrl)

    if (query !== undefined) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          resolved.searchParams.set(key, String(value))
        }
      }
    }

    return resolved.toString()
  }

  #resolveRetry(req: HttpRequest): HttpRetryPolicy | undefined {
    if (req.retry !== undefined) {
      return req.retry
    }

    if (this.defaults.retry !== undefined) {
      return this.defaults.retry
    }

    const isWrite = !UndiciHttpClient.safeMethods.has(req.method)

    if (isWrite && req.idempotencyKey === undefined) {
      return undefined
    }

    return UndiciHttpClient.defaultRetry
  }

  #shouldRetryStatus(status: number, retry: HttpRetryPolicy): boolean {
    return (status === 429 && retry.retryOn.includes('429')) || (status === 503 && retry.retryOn.includes('503'))
  }

  #shouldRetryError(error: unknown, retry: HttpRetryPolicy): boolean {
    return (
      (error instanceof HttpTimeoutError && retry.retryOn.includes('timeout')) ||
      (error instanceof HttpNetworkError && retry.retryOn.includes('network'))
    )
  }

  async #backoff(retry: HttpRetryPolicy): Promise<void> {
    const span = retry.backoffMs.max - retry.backoffMs.min
    const delay = retry.backoffMs.min + Math.random() * Math.max(span, 0)

    await new Promise((resolve) => {
      setTimeout(resolve, delay)
    })
  }

  #log(method: HttpMethod, host: string, status: number, durationMs: number): void {
    LoggerLocator.get().context(this.defaults.name).info({method, host, status, durationMs}, 'outbound http')
  }

  #logFailure(method: HttpMethod, host: string, durationMs: number): void {
    LoggerLocator.get().context(this.defaults.name).warn({method, host, durationMs}, 'outbound http failed')
  }

  #rethrow(error: unknown, timeoutSignal: AbortSignal, callerSignal: AbortSignal | undefined): never {
    if (callerSignal?.aborted) {
      throw new HttpAbortedError()
    }

    if (timeoutSignal.aborted || (error instanceof Error && error.name === 'TimeoutError')) {
      throw new HttpTimeoutError()
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new HttpAbortedError()
    }

    if (
      error instanceof HttpTimeoutError ||
      error instanceof HttpAbortedError ||
      error instanceof HttpResponseTooLargeError
    ) {
      throw error
    }

    throw new HttpNetworkError(error)
  }
}
