import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {DateUtils} from '@b2b-saas-starter-kit/utils'

import type {Logger} from '@b2b-saas-starter-kit/platform'
import {LoggerLocator} from '@b2b-saas-starter-kit/platform'

import type {OutboxRelay} from '@b2b-saas-starter-kit/postgres'
import type {JobScheduler} from '@b2b-saas-starter-kit/messaging'

import {OutboxRelayService} from './outbox-relay.service'
import type {WorkerOutboxConfig} from './worker-outbox-config.token'

type LogEntry = {
  readonly level: 'error'
  readonly data: object
  readonly message?: string
}

describe('OutboxRelayService', () => {
  const logs: LogEntry[] = []
  const pollIntervalMs = DateUtils.secToMs(DateUtils.minToSec(1))
  const outboxConfig: WorkerOutboxConfig = {
    pollIntervalMs,
    batchSize: 25,
  }

  const logger: Logger = {
    context: () => logger,
    trace: () => undefined,
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: (dataOrMessage, message) => {
      logs.push({level: 'error', data: dataOrMessage as object, message})
    },
    fatal: () => undefined,
  }

  beforeEach(() => {
    logs.length = 0
    LoggerLocator.init(logger)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    LoggerLocator.reset()
  })

  it('claims a batch and enqueues outbox jobs', async () => {
    const relay = {
      claimBatch: vi.fn(async () => [{id: 'outbox-1', eventType: 'UserCreated', tenantId: null}]),
    } satisfies Pick<OutboxRelay, 'claimBatch'>

    const scheduler = {
      addOutboxJob: vi.fn(async () => undefined),
    } satisfies Pick<JobScheduler, 'addOutboxJob'>

    const service = new OutboxRelayService(
      relay as unknown as OutboxRelay,
      scheduler as unknown as JobScheduler,
      outboxConfig,
    )

    service.onModuleInit()
    await vi.advanceTimersByTimeAsync(0)

    expect(relay.claimBatch).toHaveBeenCalledWith(25)
    expect(scheduler.addOutboxJob).toHaveBeenCalledWith({
      outboxId: 'outbox-1',
      eventType: 'UserCreated',
      tenantId: null,
    })

    service.onModuleDestroy()
  })

  it('logs a drain failure and polls again on the next tick', async () => {
    const error = new Error('db down')
    const relay = {
      claimBatch: vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce([]),
    } satisfies Pick<OutboxRelay, 'claimBatch'>

    const scheduler = {
      addOutboxJob: vi.fn(async () => undefined),
    } satisfies Pick<JobScheduler, 'addOutboxJob'>

    const service = new OutboxRelayService(
      relay as unknown as OutboxRelay,
      scheduler as unknown as JobScheduler,
      outboxConfig,
    )

    service.onModuleInit()
    await vi.advanceTimersByTimeAsync(0)

    expect(logs).toEqual([{level: 'error', data: {err: error}, message: 'outbox drain failed'}])
    expect(relay.claimBatch).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(pollIntervalMs)

    expect(relay.claimBatch).toHaveBeenCalledTimes(2)

    service.onModuleDestroy()
  })

  it('does not start a second drain while the first is still running', async () => {
    let release!: () => void
    const started = vi.fn()
    const relay = {
      claimBatch: vi.fn(
        async () =>
          new Promise<readonly never[]>((resolve) => {
            started()

            release = () => {
              resolve([])
            }
          }),
      ),
    } satisfies Pick<OutboxRelay, 'claimBatch'>

    const scheduler = {
      addOutboxJob: vi.fn(async () => undefined),
    } satisfies Pick<JobScheduler, 'addOutboxJob'>

    const service = new OutboxRelayService(
      relay as unknown as OutboxRelay,
      scheduler as unknown as JobScheduler,
      outboxConfig,
    )

    service.onModuleInit()
    await vi.advanceTimersByTimeAsync(0)

    expect(started).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(pollIntervalMs * 5)

    expect(started).toHaveBeenCalledTimes(1)

    release()
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(pollIntervalMs)

    expect(started).toHaveBeenCalledTimes(2)

    service.onModuleDestroy()
  })
})
