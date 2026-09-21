import {Inject, Injectable, type OnModuleDestroy, type OnModuleInit} from '@nestjs/common'

import {OutboxRelay} from '@b2b-saas-starter-kit/postgres'
import {JobScheduler} from '@b2b-saas-starter-kit/messaging'

import {WORKER_OUTBOX_CONFIG, type WorkerOutboxConfig} from './worker-outbox-config.token'

/**
 * Polls the transactional outbox and enqueues claimed rows onto BullMQ.
 */
@Injectable()
export class OutboxRelayService implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | undefined

  constructor(
    private readonly relay: OutboxRelay,
    private readonly scheduler: JobScheduler,
    @Inject(WORKER_OUTBOX_CONFIG) private readonly outboxConfig: WorkerOutboxConfig,
  ) {}

  onModuleInit(): void {
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
    let claimed = await this.relay.claimBatch(this.outboxConfig.batchSize)

    while (claimed.length > 0) {
      for (const row of claimed) {
        await this.scheduler.addOutboxJob({
          outboxId: row.id,
          eventType: row.eventType,
          tenantId: row.tenantId,
        })
      }

      if (claimed.length < this.outboxConfig.batchSize) {
        return
      }

      claimed = await this.relay.claimBatch(this.outboxConfig.batchSize)
    }
  }
}
