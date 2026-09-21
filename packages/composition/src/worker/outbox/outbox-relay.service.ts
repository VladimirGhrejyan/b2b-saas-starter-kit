import {Inject, Injectable, type OnModuleDestroy, type OnModuleInit} from '@nestjs/common'

import {LoggerLocator} from '@b2b-saas-starter-kit/platform'

import {OutboxRelay} from '@b2b-saas-starter-kit/postgres'
import {JobScheduler} from '@b2b-saas-starter-kit/messaging'

import {WORKER_OUTBOX_CONFIG, type WorkerOutboxConfig} from './worker-outbox-config.token'

/**
 * Polls the transactional outbox and enqueues claimed rows onto BullMQ.
 */
@Injectable()
export class OutboxRelayService implements OnModuleInit, OnModuleDestroy {
  #stopped = false

  #timer: NodeJS.Timeout | undefined

  private readonly logger = LoggerLocator.get().context(OutboxRelayService.name)

  constructor(
    private readonly relay: OutboxRelay,
    private readonly scheduler: JobScheduler,
    @Inject(WORKER_OUTBOX_CONFIG) private readonly outboxConfig: WorkerOutboxConfig,
  ) {}

  onModuleInit(): void {
    this.#stopped = false
    void this.#tick()
  }

  onModuleDestroy(): void {
    this.#stopped = true

    if (this.#timer !== undefined) {
      clearTimeout(this.#timer)
      this.#timer = undefined
    }
  }

  async #tick(): Promise<void> {
    await this.#drainSafely()

    if (this.#stopped) {
      return
    }

    this.#timer = setTimeout(() => {
      void this.#tick()
    }, this.outboxConfig.pollIntervalMs)
  }

  async #drainSafely(): Promise<void> {
    try {
      await this.#drain()
    } catch (error) {
      this.logger.error({err: error}, 'outbox drain failed')
    }
  }

  async #drain(): Promise<void> {
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
