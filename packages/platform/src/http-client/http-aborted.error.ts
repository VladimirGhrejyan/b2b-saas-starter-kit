/**
 * Thrown when the caller aborts the request via {@link AbortSignal}.
 */
export class HttpAbortedError extends Error {
  readonly code = 'HTTP_ABORTED'

  constructor() {
    super('Outbound HTTP request was aborted')
    this.name = new.target.name
  }
}
