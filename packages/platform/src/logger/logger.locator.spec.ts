import {afterEach, describe, expect, it} from 'vitest'

import {LoggerLocator} from './logger.locator'
import type {Logger} from './logger.port'
import {LoggerNotInitializedError} from './logger-not-initialized.error'

const createFakeLogger = (label: string): Logger => {
  const fake: Logger = {
    context: (name) => createFakeLogger(`${label}.${name}`),
    trace: () => undefined,
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    fatal: () => undefined,
  }

  return fake
}

describe('LoggerLocator', () => {
  afterEach(() => {
    LoggerLocator.reset()
  })

  it('throws LoggerNotInitializedError before init', () => {
    expect(() => LoggerLocator.get()).toThrow(LoggerNotInitializedError)

    const error = new LoggerNotInitializedError()

    expect(error.code).toBe('LOGGER_NOT_INITIALIZED')
    expect(error.message).toBe('Logger is not initialized')
    expect(error.name).toBe('LoggerNotInitializedError')
  })

  it('returns the installed logger after init', () => {
    const logger = createFakeLogger('root')

    LoggerLocator.init(logger)

    expect(LoggerLocator.get()).toBe(logger)
    expect(LoggerLocator.get().context('UseCase')).not.toBe(logger)
  })

  it('overwrites on a second init', () => {
    const first = createFakeLogger('first')
    const second = createFakeLogger('second')

    LoggerLocator.init(first)
    LoggerLocator.init(second)

    expect(LoggerLocator.get()).toBe(second)
  })

  it('throws again after reset', () => {
    LoggerLocator.init(createFakeLogger('root'))
    LoggerLocator.reset()

    expect(() => LoggerLocator.get()).toThrow(LoggerNotInitializedError)
  })
})
