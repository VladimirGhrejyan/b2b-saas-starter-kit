import {describe, expect, it, vi} from 'vitest'

import type {EventBus} from '@b2b-saas-starter-kit/platform'

import type {OutboxRelay} from '@b2b-saas-starter-kit/postgres'

import {DomainEventLoggingHandler} from './domain-event-logging.handler'
import {OutboxRelayService} from './outbox-relay.service'
import type {WorkerOutboxConfig} from './worker-outbox-config.token'

describe('OutboxRelayService', () => {
  it('registers handlers and drains the relay on init', async () => {
    const relay = {
      processBatch: vi.fn(async () => 0),
    } satisfies Pick<OutboxRelay, 'processBatch'>

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
      eventBus,
      new DomainEventLoggingHandler(),
      outboxConfig,
    )

    service.onModuleInit()

    expect(eventBus.register).toHaveBeenCalled()
    expect(relay.processBatch).toHaveBeenCalledWith({batchSize: 25})

    service.onModuleDestroy()
  })
})
