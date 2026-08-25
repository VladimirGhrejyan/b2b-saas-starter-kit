import {LoggerLocator} from './logger.locator'

/**
 * Clears the process logger. For tests (`afterEach`) and process teardown.
 */
export function resetLogger(): void {
  LoggerLocator.reset()
}
