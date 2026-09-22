import {isSpanContextValid, trace} from '@opentelemetry/api'
import type {Logger as PinoInstance, LoggerOptions} from 'pino'
import pino from 'pino'
import pinoPretty from 'pino-pretty'

import type {Logger, LogLevel} from '@b2b-saas-starter-kit/platform'
import {RequestContextLocator} from '@b2b-saas-starter-kit/platform'

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
      mixin() {
        return {
          ...PinoLogger.#requestContextFields(),
          ...PinoLogger.#activeSpanFields(),
        }
      },
    }

    if (destination !== undefined) {
      return pino(pinoOptions, destination)
    }

    // Stream destination (not `transport.target`) so webpack can inline pino-pretty.
    // Worker-thread transports resolve the package from node_modules at runtime.
    if (isPretty) {
      return pino(
        pinoOptions,
        pinoPretty({
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
        }),
      )
    }

    return pino(pinoOptions)
  }

  static #requestContextFields(): Record<string, string> {
    const context = RequestContextLocator.get()

    if (context === undefined) {
      return {}
    }

    return {
      requestId: context.requestId,
      ...(context.tenantId === undefined ? {} : {tenantId: context.tenantId}),
      ...(context.actorId === undefined ? {} : {actorId: context.actorId}),
    }
  }

  static #activeSpanFields(): Record<string, string> {
    const span = trace.getActiveSpan()

    if (span === undefined) {
      return {}
    }

    const spanContext = span.spanContext()

    if (!isSpanContextValid(spanContext)) {
      return {}
    }

    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
    }
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
