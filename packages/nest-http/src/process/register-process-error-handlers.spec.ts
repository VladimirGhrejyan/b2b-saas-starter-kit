import {afterEach, describe, expect, it, vi} from 'vitest'

import {LoggerLocator} from '@b2b-saas-starter-kit/platform'

import {FakeLogger} from '../testing/fake-logger'

import {registerProcessErrorHandlers} from './register-process-error-handlers'

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
