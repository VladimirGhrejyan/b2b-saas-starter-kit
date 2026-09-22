/* eslint-disable no-console -- ConsoleLogger is the web adapter for LoggerPort. */

import type {LoggerPort} from '../../ports/logger.port'

export class ConsoleLogger implements LoggerPort {
  constructor(private readonly enabled = true) {}

  debug(message: string, ...args: unknown[]): void {
    if (this.enabled) {
      console.debug(message, ...args)
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.enabled) {
      console.info(message, ...args)
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.enabled) {
      console.warn(message, ...args)
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.enabled) {
      console.error(message, ...args)
    }
  }
}
