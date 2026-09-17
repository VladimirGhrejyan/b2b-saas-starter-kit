import {Inject, Injectable, type OnModuleDestroy, type OnModuleInit} from '@nestjs/common'

import type {EventBus} from '@b2b-saas-starter-kit/platform'
import {EVENT_BUS} from '@b2b-saas-starter-kit/platform'

import {OutboxRelay} from '@b2b-saas-starter-kit/postgres'

import {DomainEventLoggingHandler} from './domain-event-logging.handler'
import {DOMAIN_EVENT_TYPES} from './domain-event-types'
import {WORKER_OUTBOX_CONFIG, type WorkerOutboxConfig} from './worker-outbox-config.token'

/**
 * Polls the transactional outbox and dispatches claimed events through {@link EventBus}.
 */
@Injectable()
export class OutboxRelayService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | undefined

  constructor(
    private readonly relay: OutboxRelay,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus,
    private readonly loggingHandler: DomainEventLoggingHandler,
    @Inject(WORKER_OUTBOX_CONFIG) private readonly outboxConfig: WorkerOutboxConfig,
  ) {}

  onModuleInit(): void {
    for (const type of DOMAIN_EVENT_TYPES) {
      this.eventBus.register(type, (event) => {
        this.loggingHandler.handle(event)

        return Promise.resolve()
      })
    }

    void this.drain()
    this.timer = setInterval(() => {
      void this.drain()
    }, this.outboxConfig.pollIntervalMs)
  }

  onModuleDestroy(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer)
      this.timer = undefined
    }
  }

  private async drain(): Promise<void> {
    let processed = await this.relay.processBatch({batchSize: this.outboxConfig.batchSize})

    while (processed === this.outboxConfig.batchSize) {
      processed = await this.relay.processBatch({batchSize: this.outboxConfig.batchSize})
    }
  }
}
