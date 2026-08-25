import {afterEach, describe, expect, it} from 'vitest'

import {getLogger} from './get-logger'
import {initLogger} from './init-logger'
import type {Logger} from './logger.port'
import {LoggerNotInitializedError} from './logger-not-initialized.error'
import {resetLogger} from './reset-logger'

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

describe('logger locator', () => {
  afterEach(() => {
    resetLogger()
  })

  it('throws LoggerNotInitializedError before init', () => {
    expect(() => getLogger()).toThrow(LoggerNotInitializedError)

    const error = new LoggerNotInitializedError()

    expect(error.code).toBe('LOGGER_NOT_INITIALIZED')
    expect(error.message).toBe('Logger is not initialized')
    expect(error.name).toBe('LoggerNotInitializedError')
  })

  it('returns the installed logger after initLogger', () => {
    const logger = createFakeLogger('root')

    initLogger(logger)

    expect(getLogger()).toBe(logger)
    expect(getLogger().context('UseCase')).not.toBe(logger)
  })

  it('overwrites on a second initLogger', () => {
    const first = createFakeLogger('first')
    const second = createFakeLogger('second')

    initLogger(first)
    initLogger(second)

    expect(getLogger()).toBe(second)
  })

  it('throws again after resetLogger', () => {
    initLogger(createFakeLogger('root'))
    resetLogger()

    expect(() => getLogger()).toThrow(LoggerNotInitializedError)
  })
})
