/**
 * Thrown by {@link getLogger} when {@link initLogger} has not run.
 */
export class LoggerNotInitializedError extends Error {
  readonly code = 'LOGGER_NOT_INITIALIZED'

  constructor() {
    super('Logger is not initialized')
    this.name = new.target.name
  }
}
