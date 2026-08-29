/**
 * Thrown when neither the request nor the scope supplies {@link HttpRequest.timeoutMs}.
 */
export class HttpTimeoutRequiredError extends Error {
  readonly code = 'HTTP_TIMEOUT_REQUIRED'

  constructor() {
    super('HttpClientPort.request requires timeoutMs on the request or scope')
    this.name = new.target.name
  }
}
