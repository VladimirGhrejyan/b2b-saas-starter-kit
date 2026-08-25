import {LoggerLocator} from './logger.locator'
import type {Logger} from './logger.port'

/**
 * Installs the process logger. Overwrites a previous instance (bootstrap and tests).
 */
export function initLogger(implementation: Logger): void {
  LoggerLocator.init(implementation)
}
