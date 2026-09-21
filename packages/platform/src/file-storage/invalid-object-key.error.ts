/**
 * Thrown when an object-storage key is missing, malformed, or fails charset rules.
 */
export class InvalidObjectKeyError extends Error {
  readonly code = 'INVALID_OBJECT_KEY'

  constructor(readonly key: string) {
    super(`Invalid object key: ${key}`)
    this.name = new.target.name
  }
}
