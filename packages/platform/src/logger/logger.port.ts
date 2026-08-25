/**
 * Structured logger. Not a Nest provider — use {@link LoggerLocator.init} / {@link LoggerLocator.get}.
 *
 * Overloads match pino: `info('message')` or `info({data}, 'message')`.
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface Logger {
  context(name: string): Logger
  trace(dataOrMessage: object | string, message?: string): void
  debug(dataOrMessage: object | string, message?: string): void
  info(dataOrMessage: object | string, message?: string): void
  warn(dataOrMessage: object | string, message?: string): void
  error(dataOrMessage: object | string, message?: string): void
  fatal(dataOrMessage: object | string, message?: string): void
}
