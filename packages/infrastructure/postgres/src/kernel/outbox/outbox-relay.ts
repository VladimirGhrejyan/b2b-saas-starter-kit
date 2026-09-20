import {Inject, Injectable} from '@nestjs/common'
import type {DataSource, EntityManager} from 'typeorm'

import {TenantId, userActor, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'
import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

import type {DomainEvent} from '@b2b-saas-starter-kit/domain'

import type {EventBus, TenantContext} from '@b2b-saas-starter-kit/platform'
import {EVENT_BUS, TENANT_CONTEXT} from '@b2b-saas-starter-kit/platform'

import {DATA_SOURCE} from '../tokens'

import {OutboxSerializer} from './outbox.serializer'
import {OutboxEntryEntity} from './outbox-entry.entity'
import {OutboxPendingRowMapper} from './outbox-pending-row.mapper'
import type {OutboxRelayOptions} from './outbox-relay.types'
import {OutboxStatus} from './outbox-status'

/**
 * Claims pending outbox rows and dispatches them through {@link EventBus}.
 */
@Injectable()
export class OutboxRelay {
  static readonly WORKER_ACTOR_ID = UserId.parse('00000000-0000-4000-8000-000000000001')

  constructor(
    @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus,
    @Inject(TENANT_CONTEXT) private readonly tenantContext: TenantContext,
  ) {}

  async processBatch(options: OutboxRelayOptions): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const claimed = await this.#claimPending(manager, options.batchSize)

      for (const entry of claimed) {
        await this.#processEntry(manager, entry)
      }

      return claimed.length
    })
  }

  async #processEntry(manager: EntityManager, entry: OutboxEntryEntity): Promise<void> {
    try {
      const event = OutboxSerializer.deserialize(entry.payload)

      await this.#dispatchEvent(entry.tenantId, event)

      entry.status = OutboxStatus.parse('processed')
      entry.processedAt = new Date()
      await manager.save(OutboxEntryEntity, entry)
    } catch (error) {
      entry.status = OutboxStatus.parse('failed')
      entry.attemptCount += 1
      await manager.save(OutboxEntryEntity, entry)

      throw error
    }
  }

  async #dispatchEvent(tenantId: string | null, event: DomainEvent): Promise<void> {
    const dispatch = async () => this.eventBus.dispatch([event])

    if (TypeScriptUtils.isNil(tenantId)) {
      await dispatch()

      return
    }

    await this.tenantContext.run(
      {tenantId: TenantId.parse(tenantId), actor: userActor(OutboxRelay.WORKER_ACTOR_ID)},
      dispatch,
    )
  }

  async #claimPending(manager: EntityManager, batchSize: number): Promise<OutboxEntryEntity[]> {
    const rows = OutboxPendingRowMapper.parseRows(
      await manager.query(
        `
        SELECT id, event_type, payload, tenant_id, status, created_at, processed_at, attempt_count
        FROM outbox
        WHERE status = $2
        ORDER BY created_at ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      `,
        [batchSize, OutboxStatus.parse('pending')],
      ),
    )

    if (rows.length === 0) {
      return []
    }

    const ids = rows.map((row) => row.id)

    await manager.query(
      `
        UPDATE outbox
        SET status = $2
        WHERE id = ANY($1::uuid[])
      `,
      [ids, OutboxStatus.parse('processing')],
    )

    return rows.map((row) => OutboxPendingRowMapper.toEntity(row))
  }
}
