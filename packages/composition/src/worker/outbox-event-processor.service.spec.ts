import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import type {EventBus, Logger, TenantContext} from '@b2b-saas-starter-kit/platform'
import {LoggerLocator} from '@b2b-saas-starter-kit/platform'

import type {OutboxRelay} from '@b2b-saas-starter-kit/postgres'
import {OutboxStatus} from '@b2b-saas-starter-kit/postgres'
import type {JobHandler, OutboxJobPayload, QueueWorkerFactory} from '@b2b-saas-starter-kit/messaging'

import {OutboxEventProcessorService} from './outbox-event-processor.service'

type LogEntry = {
  readonly level: 'info'
  readonly data: object
  readonly message?: string
}

describe('OutboxEventProcessorService', () => {
  const logs: LogEntry[] = []
  const occurredAt = '2026-01-01T00:00:00.000Z'
  const processingEntry = {
    id: 'outbox-1',
    eventType: 'UserCreated',
    payload: {type: 'UserCreated', occurredAt},
    tenantId: null as string | null,
    status: OutboxStatus.parse('processing'),
  }

  const logger: Logger = {
    context: () => logger,
    trace: () => undefined,
    debug: () => undefined,
    info: (dataOrMessage, message) => {
      logs.push({level: 'info', data: dataOrMessage as object, message})
    },
    warn: () => undefined,
    error: () => undefined,
    fatal: () => undefined,
  }

  beforeEach(() => {
    logs.length = 0
    LoggerLocator.init(logger)
  })

  afterEach(() => {
    LoggerLocator.reset()
  })

  it('skips dispatch when the outbox row is missing', async () => {
    const {handleJob, eventBus, relay} = createProcessor({
      findById: vi.fn(async () => null),
    })

    await handleJob(job())

    expect(eventBus.dispatch).not.toHaveBeenCalled()
    expect(relay.complete).not.toHaveBeenCalled()
    expect(logs).toEqual([])
  })

  it('skips dispatch when the outbox row is not processing', async () => {
    const {handleJob, eventBus, relay} = createProcessor({
      findById: vi.fn(async () => ({...processingEntry, status: OutboxStatus.parse('processed')})),
    })

    await handleJob(job())

    expect(eventBus.dispatch).not.toHaveBeenCalled()
    expect(relay.complete).not.toHaveBeenCalled()
  })

  it('dispatches without tenant scope and marks the row processed', async () => {
    const {handleJob, eventBus, relay, tenantContext} = createProcessor({
      findById: vi.fn(async () => processingEntry),
    })

    await handleJob(job())

    expect(logs).toEqual([
      {
        level: 'info',
        data: {outboxId: 'outbox-1', eventType: 'UserCreated'},
        message: 'outbox event dispatching',
      },
    ])
    expect(tenantContext.run).not.toHaveBeenCalled()
    expect(eventBus.dispatch).toHaveBeenCalledWith([{type: 'UserCreated', occurredAt: new Date(occurredAt)}])
    expect(relay.complete).toHaveBeenCalledWith('outbox-1')
  })

  it('restores tenant context before dispatch when the row is tenant-scoped', async () => {
    const tenantId = '11111111-1111-4111-8111-111111111111'
    const {handleJob, eventBus, relay, tenantContext} = createProcessor({
      findById: vi.fn(async () => ({...processingEntry, tenantId})),
    })

    await handleJob(job())

    expect(tenantContext.run).toHaveBeenCalledOnce()
    expect(eventBus.dispatch).toHaveBeenCalled()
    expect(relay.complete).toHaveBeenCalledWith('outbox-1')
  })

  it('rethrows handler errors and does not fail the row before the last attempt', async () => {
    const error = new Error('handler failed')
    const {handleJob, relay} = createProcessor({
      findById: vi.fn(async () => processingEntry),
      dispatch: vi.fn(async () => {
        throw error
      }),
    })

    await expect(handleJob(job({attemptsMade: 0, maxAttempts: 3}))).rejects.toThrow(error)
    expect(relay.fail).not.toHaveBeenCalled()
    expect(relay.complete).not.toHaveBeenCalled()
  })

  it('marks the row failed on the last attempt', async () => {
    const error = new Error('handler failed')
    const {handleJob, relay} = createProcessor({
      findById: vi.fn(async () => processingEntry),
      dispatch: vi.fn(async () => {
        throw error
      }),
    })

    await expect(handleJob(job({attemptsMade: 2, maxAttempts: 3}))).rejects.toThrow(error)
    expect(relay.fail).toHaveBeenCalledWith('outbox-1')
    expect(relay.complete).not.toHaveBeenCalled()
  })
})

function job(
  overrides: Partial<{readonly attemptsMade: number; readonly maxAttempts: number}> = {},
): Parameters<JobHandler<OutboxJobPayload>>[0] {
  return {
    name: 'UserCreated',
    data: {outboxId: 'outbox-1', eventType: 'UserCreated', tenantId: null},
    attemptsMade: overrides.attemptsMade ?? 0,
    maxAttempts: overrides.maxAttempts ?? 3,
  }
}

function createProcessor(options: {
  readonly findById: (id: string) => Promise<unknown>
  readonly dispatch?: EventBus['dispatch']
}): {
  handleJob: JobHandler<OutboxJobPayload>
  eventBus: EventBus
  relay: Pick<OutboxRelay, 'findById' | 'complete' | 'fail'>
  tenantContext: {readonly run: ReturnType<typeof vi.fn>}
} {
  let handleJob: JobHandler<OutboxJobPayload> | undefined

  const relay = {
    findById: options.findById,
    complete: vi.fn(async () => undefined),
    fail: vi.fn(async () => undefined),
  }

  const eventBus = {
    register: vi.fn(),
    registerAll: vi.fn(),
    dispatch: options.dispatch ?? vi.fn(async () => undefined),
  } satisfies EventBus

  const tenantContext = {
    run: vi.fn(async <T>(_scope: unknown, work: () => Promise<T>): Promise<T> => work()),
  }

  const workers = {
    create: vi.fn((_queue: string, handler: JobHandler<OutboxJobPayload>) => {
      handleJob = handler

      return {close: vi.fn(async () => undefined)}
    }),
  }

  const service = new OutboxEventProcessorService(
    workers as unknown as QueueWorkerFactory,
    relay as unknown as OutboxRelay,
    eventBus,
    tenantContext as unknown as TenantContext,
  )

  service.onModuleInit()

  if (handleJob === undefined) {
    throw new Error('QueueWorkerFactory.create did not capture a handler')
  }

  return {
    handleJob,
    eventBus,
    relay: relay as Pick<OutboxRelay, 'findById' | 'complete' | 'fail'>,
    tenantContext,
  }
}
