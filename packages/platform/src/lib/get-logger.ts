import {LoggerLocator} from './logger.locator'
import type {Logger} from './logger.port'

/**
 * Returns the process logger. Throws {@link LoggerNotInitializedError} when unset.
 */
export function getLogger(): Logger {
  return LoggerLocator.get()
}
