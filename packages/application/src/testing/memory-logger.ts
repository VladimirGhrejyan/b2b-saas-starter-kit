import type {Logger, LogLevel} from '@b2b-saas-starter-kit/platform'

import type {MemoryLogRecord} from './memory-logger.types'

/**
 * In-memory {@link Logger} for use-case tests. Children share the same `records` array.
 */
export class MemoryLogger implements Logger {
  readonly records: MemoryLogRecord[]

  readonly #context: string | undefined

  constructor(records: MemoryLogRecord[] = [], context?: string) {
    this.records = records
    this.#context = context
  }

  context(name: string): Logger {
    return new MemoryLogger(this.records, name)
  }

  trace(dataOrMessage: object | string, message?: string): void {
    this.#log('trace', dataOrMessage, message)
  }

  debug(dataOrMessage: object | string, message?: string): void {
    this.#log('debug', dataOrMessage, message)
  }

  info(dataOrMessage: object | string, message?: string): void {
    this.#log('info', dataOrMessage, message)
  }

  warn(dataOrMessage: object | string, message?: string): void {
    this.#log('warn', dataOrMessage, message)
  }

  error(dataOrMessage: object | string, message?: string): void {
    this.#log('error', dataOrMessage, message)
  }

  fatal(dataOrMessage: object | string, message?: string): void {
    this.#log('fatal', dataOrMessage, message)
  }

  #log(level: LogLevel, dataOrMessage: object | string, message?: string): void {
    if (typeof dataOrMessage === 'string') {
      this.records.push({level, context: this.#context, data: undefined, message: dataOrMessage})

      return
    }

    this.records.push({level, context: this.#context, data: dataOrMessage, message})
  }
}
