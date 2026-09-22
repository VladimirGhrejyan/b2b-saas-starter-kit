import {afterEach, describe, expect, it, vi} from 'vitest'

import type {Logger} from '@b2b-saas-starter-kit/platform'
import {LoggerLocator} from '@b2b-saas-starter-kit/platform'

import {registerProcessErrorHandlers} from './register-process-error-handlers'

class FakeLogger implements Logger {
  readonly records: {level: string}[] = []

  context(_name: string): Logger {
    return this
  }

  trace(): void {
    this.records.push({level: 'trace'})
  }

  debug(): void {
    this.records.push({level: 'debug'})
  }

  info(): void {
    this.records.push({level: 'info'})
  }

  warn(): void {
    this.records.push({level: 'warn'})
  }

  error(): void {
    this.records.push({level: 'error'})
  }

  fatal(): void {
    this.records.push({level: 'fatal'})
  }
}

describe('registerProcessErrorHandlers', () => {
  afterEach(() => {
    LoggerLocator.reset()
    vi.restoreAllMocks()
  })

  it('logs unhandledRejection and uncaughtException as fatal', () => {
    const logger = new FakeLogger()
    const handlers = new Map<string, (...args: unknown[]) => void>()

    LoggerLocator.init(logger)
    vi.spyOn(process, 'on').mockImplementation((event: string | symbol, listener: (...args: unknown[]) => void) => {
      handlers.set(String(event), listener)

      return process
    })

    registerProcessErrorHandlers()

    handlers.get('unhandledRejection')?.(new Error('rejected'))
    handlers.get('uncaughtException')?.(new Error('uncaught'))

    expect(logger.records.filter((record) => record.level === 'fatal')).toHaveLength(2)
  })
})
