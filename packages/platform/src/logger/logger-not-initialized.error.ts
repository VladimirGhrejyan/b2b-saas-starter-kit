/**
 * Thrown by {@link LoggerLocator.get} when {@link LoggerLocator.init} has not run.
 */
export class LoggerNotInitializedError extends Error {
  readonly code = 'LOGGER_NOT_INITIALIZED'

  constructor() {
    super('Logger is not initialized')
    this.name = new.target.name
  }
}
