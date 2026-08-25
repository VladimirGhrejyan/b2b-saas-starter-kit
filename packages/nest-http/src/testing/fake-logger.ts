import type {Logger} from '@b2b-saas-starter-kit/platform'

export class FakeLogger implements Logger {
  readonly records: {level: string; dataOrMessage: object | string; message?: string}[] = []

  context(_name: string): Logger {
    return this
  }

  trace(dataOrMessage: object | string, message?: string): void {
    this.#record('trace', dataOrMessage, message)
  }

  debug(dataOrMessage: object | string, message?: string): void {
    this.#record('debug', dataOrMessage, message)
  }

  info(dataOrMessage: object | string, message?: string): void {
    this.#record('info', dataOrMessage, message)
  }

  warn(dataOrMessage: object | string, message?: string): void {
    this.#record('warn', dataOrMessage, message)
  }

  error(dataOrMessage: object | string, message?: string): void {
    this.#record('error', dataOrMessage, message)
  }

  fatal(dataOrMessage: object | string, message?: string): void {
    this.#record('fatal', dataOrMessage, message)
  }

  #record(level: string, dataOrMessage: object | string, message?: string): void {
    this.records.push({level, dataOrMessage, message})
  }
}
