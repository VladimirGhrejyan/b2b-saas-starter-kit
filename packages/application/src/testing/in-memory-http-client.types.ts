import type {HttpClientScope, HttpRequest, HttpResponse} from '@b2b-saas-starter-kit/platform'

export type InMemoryHttpClientStore = {
  readonly requests: HttpRequest[]
  readonly stubs: Map<string, HttpResponse>
}

export type InMemoryHttpClientOptions = {
  readonly store?: InMemoryHttpClientStore
  readonly defaults?: HttpClientScope
}
