/**
 * Thrown when the response body exceeds the configured size cap.
 */
export class HttpResponseTooLargeError extends Error {
  readonly code = 'HTTP_RESPONSE_TOO_LARGE'

  constructor(maxBytes: number) {
    super(`Outbound HTTP response exceeded ${maxBytes} bytes`)
    this.name = new.target.name
  }
}
