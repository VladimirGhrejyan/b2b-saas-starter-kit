import {Inject, Injectable} from '@nestjs/common'
import type {Queue} from 'bullmq'

import {MAINTENANCE_QUEUE, OUTBOX_QUEUE} from '../kernel/tokens'

import type {OutboxJobPayload} from './job-handler.types'

/**
 * Registers repeatable maintenance jobs and enqueues one-off work.
 */
@Injectable()
export class JobScheduler {
  constructor(
    @Inject(MAINTENANCE_QUEUE) private readonly maintenance: Queue,
    @Inject(OUTBOX_QUEUE) private readonly outbox: Queue,
  ) {}

  async upsertJobScheduler(name: string, everyMs: number): Promise<void> {
    await this.maintenance.upsertJobScheduler(name, {every: everyMs}, {name, data: {}})
  }

  async addMaintenanceJob(name: string): Promise<void> {
    await this.maintenance.add(name, {})
  }

  async addOutboxJob(payload: OutboxJobPayload): Promise<void> {
    await this.outbox.add(payload.eventType, payload, {jobId: payload.outboxId})
  }
}
