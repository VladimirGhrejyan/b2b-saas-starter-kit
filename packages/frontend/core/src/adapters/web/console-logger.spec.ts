import {afterEach, describe, expect, it, vi} from 'vitest'

import {ConsoleLogger} from './console-logger'

describe('ConsoleLogger', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('writes when enabled', () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const logger = new ConsoleLogger(true)

    logger.debug('debug')
    logger.info('info')
    logger.warn('warn')
    logger.error('error')

    expect(debug).toHaveBeenCalledWith('debug')
    expect(info).toHaveBeenCalledWith('info')
    expect(warn).toHaveBeenCalledWith('warn')
    expect(error).toHaveBeenCalledWith('error')
  })

  it('writes nothing when disabled', () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const logger = new ConsoleLogger(false)

    logger.debug('debug')
    logger.info('info')
    logger.warn('warn')
    logger.error('error')

    expect(debug).not.toHaveBeenCalled()
    expect(info).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  })
})
