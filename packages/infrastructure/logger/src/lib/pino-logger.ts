import type {Logger as PinoInstance, LoggerOptions} from 'pino'
import pino from 'pino'

import type {Logger, LogLevel} from '@b2b-saas-starter-kit/platform'

import type {PinoLoggerOptions} from './pino-logger.types'

/**
 * Pino adapter for the platform {@link Logger} port. Not a Nest provider.
 */
export class PinoLogger implements Logger {
  static readonly #redactPaths = ['req.headers.authorization', 'req.headers.Authorization']

  readonly #pino: PinoInstance

  constructor(options: PinoLoggerOptions = {}, instance?: PinoInstance) {
    this.#pino = instance ?? PinoLogger.#create(options)
  }

  context(name: string): Logger {
    return new PinoLogger({}, this.#pino.child({context: name}))
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

  static #create(options: PinoLoggerOptions): PinoInstance {
    const {level = 'info', isPretty = false, destination} = options

    const pinoOptions: LoggerOptions = {
      level,
      redact: [...PinoLogger.#redactPaths],
    }

    if (isPretty) {
      pinoOptions.transport = {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      }
    }

    return destination === undefined ? pino(pinoOptions) : pino(pinoOptions, destination)
  }

  #log(level: LogLevel, dataOrMessage: object | string, message?: string): void {
    if (typeof dataOrMessage === 'string') {
      this.#pino[level](dataOrMessage)

      return
    }

    const data = dataOrMessage instanceof Error ? {err: dataOrMessage} : dataOrMessage

    if (message === undefined) {
      this.#pino[level](data)

      return
    }

    this.#pino[level](data, message)
  }
}
