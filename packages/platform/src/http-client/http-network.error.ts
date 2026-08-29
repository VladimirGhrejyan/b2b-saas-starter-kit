/**
 * Thrown when the peer cannot be reached (DNS, TCP, TLS).
 */
export class HttpNetworkError extends Error {
  readonly code = 'HTTP_NETWORK'

  constructor(cause?: unknown) {
    super('Outbound HTTP request failed', {cause})
    this.name = new.target.name
  }
}
