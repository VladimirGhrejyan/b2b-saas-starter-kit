import type {Logger} from './logger.port'
import {LoggerNotInitializedError} from './logger-not-initialized.error'

/**
 * Process-wide logger slot. Prefer {@link initLogger} / {@link getLogger} / {@link resetLogger}.
 */
export class LoggerLocator {
  static #instance: Logger | undefined

  static init(implementation: Logger): void {
    LoggerLocator.#instance = implementation
  }

  static get(): Logger {
    if (LoggerLocator.#instance === undefined) {
      throw new LoggerNotInitializedError()
    }

    return LoggerLocator.#instance
  }

  static reset(): void {
    LoggerLocator.#instance = undefined
  }
}
