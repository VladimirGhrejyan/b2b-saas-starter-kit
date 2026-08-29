import type {HttpClientScope, HttpRequest, HttpResponse} from './http-client.types'

/**
 * Outbound HTTP. Transport failures throw; 4xx/5xx are returned on {@link HttpResponse}.
 * `timeoutMs` is required after merge (request or {@link HttpClientPort.scope}).
 */
export interface HttpClientPort {
  request(req: HttpRequest): Promise<HttpResponse>
  scope(defaults: HttpClientScope): HttpClientPort
}
