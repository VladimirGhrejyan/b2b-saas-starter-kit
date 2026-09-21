import {EventEmitter} from 'node:events'

import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import type {Logger} from '@b2b-saas-starter-kit/platform'
import {LoggerLocator} from '@b2b-saas-starter-kit/platform'

import {attachWorkerObservability} from './attach-worker-observability'

type LogEntry = {
  readonly level: 'warn' | 'error'
  readonly data: object
  readonly message?: string
}

describe('attachWorkerObservability', () => {
  const logs: LogEntry[] = []

  const logger: Logger = {
    context: () => logger,
    trace: () => undefined,
    debug: () => undefined,
    info: () => undefined,
    warn: (dataOrMessage, message) => {
      logs.push({level: 'warn', data: dataOrMessage as object, message})
    },
    error: (dataOrMessage, message) => {
      logs.push({level: 'error', data: dataOrMessage as object, message})
    },
    fatal: () => undefined,
  }

  beforeEach(() => {
    logs.length = 0
    LoggerLocator.init(logger)
  })

  afterEach(() => {
    LoggerLocator.reset()
  })

  it('logs worker-level errors', () => {
    const worker = new EventEmitter()
    const error = new Error('redis down')

    attachWorkerObservability(worker, 'outbox')
    worker.emit('error', error)

    expect(logs).toEqual([{level: 'error', data: {queueName: 'outbox', err: error}, message: 'worker error'}])
  })

  it('logs stalled jobs', () => {
    const worker = new EventEmitter()

    attachWorkerObservability(worker, 'maintenance')
    worker.emit('stalled', 'job-1')

    expect(logs).toEqual([{level: 'warn', data: {queueName: 'maintenance', jobId: 'job-1'}, message: 'job stalled'}])
  })

  it('logs a retryable job failure', () => {
    const worker = new EventEmitter()
    const error = new Error('transient')
    const job = {id: 'job-2', name: 'UserCreated', attemptsMade: 1, opts: {attempts: 3}}

    attachWorkerObservability(worker, 'outbox')
    worker.emit('failed', job, error)

    expect(logs).toEqual([
      {
        level: 'error',
        data: {
          queueName: 'outbox',
          jobId: 'job-2',
          name: 'UserCreated',
          attemptsMade: 1,
          maxAttempts: 3,
          err: error,
        },
        message: 'job failed',
      },
    ])
  })

  it('logs terminal exhausted jobs', () => {
    const worker = new EventEmitter()
    const error = new Error('permanent')
    const job = {id: 'job-3', name: 'UserCreated', attemptsMade: 3, opts: {attempts: 3}}

    attachWorkerObservability(worker, 'outbox')
    worker.emit('failed', job, error)

    expect(logs).toEqual([
      {
        level: 'error',
        data: {
          queueName: 'outbox',
          jobId: 'job-3',
          name: 'UserCreated',
          attemptsMade: 3,
          maxAttempts: 3,
          err: error,
        },
        message: 'job exhausted',
      },
    ])
  })
})
