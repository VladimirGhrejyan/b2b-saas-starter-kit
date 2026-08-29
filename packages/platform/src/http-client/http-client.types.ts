export type HttpMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type HttpRetryTrigger = 'GET' | 'HEAD' | 'network' | 'timeout' | '429' | '503'

export type HttpRetryPolicy = {
  readonly maxRetries: number
  readonly retryOn: readonly HttpRetryTrigger[]
  readonly backoffMs: {readonly min: number; readonly max: number}
}

export type HttpRequest = {
  readonly method: HttpMethod
  readonly url: string
  readonly query?: Readonly<Record<string, string | number | boolean | undefined>>
  readonly headers?: Readonly<Record<string, string>>
  readonly body?: unknown
  readonly timeoutMs?: number
  readonly retry?: HttpRetryPolicy
  readonly idempotencyKey?: string
  readonly signal?: AbortSignal
}

export type HttpResponse = {
  readonly status: number
  readonly headers: Readonly<Record<string, string>>
  readonly body: unknown
}

export type HttpClientScope = {
  readonly name: string
  readonly baseUrl?: string
  readonly headers?: Readonly<Record<string, string>>
  readonly timeoutMs?: number
  readonly retry?: HttpRetryPolicy
}
