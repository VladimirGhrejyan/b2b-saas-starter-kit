import {Inject, Injectable, type OnModuleDestroy, type OnModuleInit} from '@nestjs/common'

import {TenantId, userActor} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {EventBus, IntegrationEvent, TenantContext} from '@b2b-saas-starter-kit/platform'
import {EVENT_BUS, TENANT_CONTEXT} from '@b2b-saas-starter-kit/platform'

import {OutboxRelay, OutboxSerializer, OutboxStatus} from '@b2b-saas-starter-kit/postgres'
import type {OutboxJobPayload} from '@b2b-saas-starter-kit/messaging'
import {QueueName, QueueWorkerFactory} from '@b2b-saas-starter-kit/messaging'

/**
 * Dispatches a claimed outbox row through {@link EventBus} and marks it processed.
 */
@Injectable()
export class OutboxEventProcessorService implements OnModuleInit, OnModuleDestroy {
  #worker: {close(): Promise<void>} | undefined

  constructor(
    private readonly workers: QueueWorkerFactory,
    private readonly relay: OutboxRelay,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus,
    @Inject(TENANT_CONTEXT) private readonly tenantContext: TenantContext,
  ) {}

  onModuleInit(): void {
    this.#worker = this.workers.create<OutboxJobPayload>(QueueName.outbox, async (job) => {
      await this.#process(job)
    })
  }

  async onModuleDestroy(): Promise<void> {
    await this.#worker?.close()
  }

  async #process(job: {
    readonly data: OutboxJobPayload
    readonly attemptsMade: number
    readonly maxAttempts: number
  }): Promise<void> {
    const entry = await this.relay.findById(job.data.outboxId)

    if (entry === null || entry.status !== OutboxStatus.parse('processing')) {
      return
    }

    try {
      await this.#dispatch(entry.tenantId, OutboxSerializer.deserialize(entry.payload))
      await this.relay.complete(entry.id)
    } catch (error) {
      if (job.attemptsMade + 1 >= job.maxAttempts) {
        await this.relay.fail(entry.id)
      }

      throw error
    }
  }

  async #dispatch(tenantId: string | null, event: IntegrationEvent): Promise<void> {
    const dispatch = async () => this.eventBus.dispatch([event])

    if (tenantId === null) {
      await dispatch()

      return
    }

    await this.tenantContext.run(
      {tenantId: TenantId.parse(tenantId), actor: userActor(OutboxRelay.WORKER_ACTOR_ID)},
      dispatch,
    )
  }
}
