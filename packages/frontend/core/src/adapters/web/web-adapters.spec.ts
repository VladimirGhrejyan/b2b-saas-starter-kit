import {ConsoleLogger} from './console-logger'
import {createWebPorts} from './create-web-ports'
import {InMemoryStorage} from './in-memory-storage'

describe('web adapters', () => {
  it('stores values in memory', () => {
    const storage = new InMemoryStorage()

    storage.set('locale', 'en')

    expect(storage.get('locale')).toBe('en')

    storage.remove('locale')

    expect(storage.get('locale')).toBeNull()
  })

  it('does not throw for console logger or default web adapters', () => {
    const logger = new ConsoleLogger()
    const ports = createWebPorts()

    expect(() => {
      logger.debug('debug')
      logger.info('info')
      logger.warn('warn')
      logger.error('error')
      ports.window.setTitle('app')
      ports.window.minimize()
      ports.linking.subscribe(() => undefined)()
    }).not.toThrow()
  })
})
