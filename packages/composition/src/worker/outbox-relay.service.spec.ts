import {describe, expect, it, vi} from 'vitest'

import type {EventBus} from '@b2b-saas-starter-kit/platform'

import type {OutboxRelay} from '@b2b-saas-starter-kit/postgres'
import type {JobScheduler} from '@b2b-saas-starter-kit/messaging'

import {DomainEventLoggingHandler} from './domain-event-logging.handler'
import {OutboxRelayService} from './outbox-relay.service'
import type {WorkerOutboxConfig} from './worker-outbox-config.token'

describe('OutboxRelayService', () => {
  it('registers handlers, claims a batch, and enqueues outbox jobs', async () => {
    const relay = {
      claimBatch: vi.fn(async () => [{id: 'outbox-1', eventType: 'UserCreated', tenantId: null}]),
    } satisfies Pick<OutboxRelay, 'claimBatch'>

    const scheduler = {
      addOutboxJob: vi.fn(async () => undefined),
    } satisfies Pick<JobScheduler, 'addOutboxJob'>

    const eventBus = {
      register: vi.fn(),
      dispatch: vi.fn(),
    } satisfies EventBus

    const outboxConfig: WorkerOutboxConfig = {
      pollIntervalMs: 60_000,
      batchSize: 25,
    }

    const service = new OutboxRelayService(
      relay as unknown as OutboxRelay,
      scheduler as unknown as JobScheduler,
      eventBus,
      new DomainEventLoggingHandler(),
      outboxConfig,
    )

    service.onModuleInit()

    expect(eventBus.register).toHaveBeenCalled()
    expect(relay.claimBatch).toHaveBeenCalledWith(25)

    await vi.waitFor(() => {
      expect(scheduler.addOutboxJob).toHaveBeenCalledWith({
        outboxId: 'outbox-1',
        eventType: 'UserCreated',
        tenantId: null,
      })
    })

    service.onModuleDestroy()
  })
})
