import {describe, expect, it} from 'vitest'

import {RequestContextLocator} from '@b2b-saas-starter-kit/platform'

import {PinoLogger} from './pino-logger'

function createCapture(): {destination: {write: (msg: string) => void}; records: () => Record<string, unknown>[]} {
  const chunks: string[] = []

  return {
    destination: {
      write(msg: string): void {
        chunks.push(msg)
      },
    },
    records: () =>
      chunks
        .join('')
        .split('\n')
        .filter((line) => line.length > 0)
        .map((line) => JSON.parse(line) as Record<string, unknown>),
  }
}

describe('PinoLogger', () => {
  it('does not emit debug when the default level is info', () => {
    const capture = createCapture()
    const logger = new PinoLogger({destination: capture.destination})

    logger.debug('hidden')
    logger.info('visible')

    const records = capture.records()

    expect(records).toHaveLength(1)
    expect(records[0]?.msg).toBe('visible')
    expect(records[0]?.level).toBe(30)
  })

  it('sets context on child records', () => {
    const capture = createCapture()
    const logger = new PinoLogger({destination: capture.destination})

    logger.context('Foo').info('hello')

    const records = capture.records()

    expect(records).toHaveLength(1)
    expect(records[0]?.context).toBe('Foo')
    expect(records[0]?.msg).toBe('hello')
  })

  it('nested context overwrites the context field', () => {
    const capture = createCapture()
    const logger = new PinoLogger({destination: capture.destination})

    logger.context('Foo').context('Bar').info('nested')

    expect(capture.records()[0]?.context).toBe('Bar')
  })

  it('serializes Error as err', () => {
    const capture = createCapture()
    const logger = new PinoLogger({destination: capture.destination})

    logger.error(new Error('x'), 'boom')

    const record = capture.records()[0]
    const err = record?.err as {message?: string} | undefined

    expect(record?.msg).toBe('boom')
    expect(err?.message).toBe('x')
  })

  it('redacts authorization headers', () => {
    const capture = createCapture()
    const logger = new PinoLogger({destination: capture.destination})

    logger.info(
      {
        req: {
          headers: {
            authorization: 'Bearer secret',
            Authorization: 'Basic secret',
          },
        },
      },
      'headers',
    )

    const headers = (capture.records()[0]?.req as {headers: Record<string, string>}).headers

    expect(headers.authorization).toBe('[Redacted]')
    expect(headers.Authorization).toBe('[Redacted]')
  })

  it('mixes request context fields onto records', async () => {
    const capture = createCapture()
    const logger = new PinoLogger({destination: capture.destination})

    await RequestContextLocator.run({requestId: 'req-1'}, async () => {
      RequestContextLocator.bind({actorId: 'user-1', tenantId: 'tenant-1'})
      logger.info('inside')
    })

    const record = capture.records()[0]

    expect(record?.msg).toBe('inside')
    expect(record?.requestId).toBe('req-1')
    expect(record?.actorId).toBe('user-1')
    expect(record?.tenantId).toBe('tenant-1')
  })

  it('omits request context fields outside a scope', () => {
    const capture = createCapture()
    const logger = new PinoLogger({destination: capture.destination})

    logger.info('outside')

    const record = capture.records()[0]

    expect(record?.msg).toBe('outside')
    expect(record?.requestId).toBeUndefined()
    expect(record?.actorId).toBeUndefined()
    expect(record?.tenantId).toBeUndefined()
  })
})
