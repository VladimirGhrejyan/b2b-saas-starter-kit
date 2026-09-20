import {Inject, Injectable} from '@nestjs/common'
import type {DataSource, EntityManager} from 'typeorm'

import {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {SqlCount} from '../persistence/sql-count'
import {DATA_SOURCE} from '../tokens'

import {OutboxEntryEntity} from './outbox-entry.entity'
import {OutboxPendingRowMapper} from './outbox-pending-row.mapper'
import type {ClaimedOutboxRow} from './outbox-relay.types'
import {OutboxStatus} from './outbox-status'

/**
 * Claims pending outbox rows for BullMQ delivery. Completion happens in the worker processor.
 */
@Injectable()
export class OutboxRelay {
  static readonly WORKER_ACTOR_ID = UserId.parse('00000000-0000-4000-8000-000000000001')

  constructor(@Inject(DATA_SOURCE) private readonly dataSource: DataSource) {}

  async claimBatch(batchSize: number): Promise<readonly ClaimedOutboxRow[]> {
    return this.dataSource.transaction(async (manager) => {
      const claimed = await this.#claimPending(manager, batchSize)

      return claimed.map((entry) => ({
        id: entry.id,
        eventType: entry.eventType,
        tenantId: entry.tenantId,
      }))
    })
  }

  async findById(id: string): Promise<OutboxEntryEntity | null> {
    return this.dataSource.manager.findOneBy(OutboxEntryEntity, {id})
  }

  async complete(id: string): Promise<void> {
    await this.dataSource.manager.update(
      OutboxEntryEntity,
      {id, status: OutboxStatus.parse('processing')},
      {
        status: OutboxStatus.parse('processed'),
        processedAt: new Date(),
      },
    )
  }

  async fail(id: string): Promise<void> {
    await this.dataSource.manager.query(
      `
        UPDATE outbox
        SET status = $2,
            attempt_count = attempt_count + 1,
            updated_at = NOW()
        WHERE id = $1 AND status = $3
      `,
      [id, OutboxStatus.parse('failed'), OutboxStatus.parse('processing')],
    )
  }

  async reclaimStaleProcessing(olderThan: Date, limit: number): Promise<number> {
    return SqlCount.parse(
      await this.dataSource.manager.query(
        `
          WITH stale AS (
            SELECT id
            FROM outbox
            WHERE status = $2 AND updated_at < $1
            ORDER BY updated_at ASC
            LIMIT $3
            FOR UPDATE SKIP LOCKED
          ),
          reset AS (
            UPDATE outbox
            SET status = $4,
                updated_at = NOW()
            WHERE id IN (SELECT id FROM stale)
            RETURNING id
          )
          SELECT COUNT(*)::int AS count FROM reset
        `,
        [olderThan, OutboxStatus.parse('processing'), limit, OutboxStatus.parse('pending')],
      ),
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
        SET status = $2,
            updated_at = NOW()
        WHERE id = ANY($1::uuid[])
      `,
      [ids, OutboxStatus.parse('processing')],
    )

    return rows.map((row) => OutboxPendingRowMapper.toEntity(row))
  }
}
