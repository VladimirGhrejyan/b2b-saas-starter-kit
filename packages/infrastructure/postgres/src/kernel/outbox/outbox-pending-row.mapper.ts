import {ObjectUtils, TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

import {OutboxEntryEntity} from './outbox-entry.entity'
import type {OutboxPendingRow} from './outbox-relay.types'
import {OutboxStatus} from './outbox-status'

/**
 * Maps raw SQL rows from {@link OutboxRelay} claim queries into typed entities.
 */
export class OutboxPendingRowMapper {
  static parseRows(raw: unknown): OutboxPendingRow[] {
    if (!Array.isArray(raw)) {
      return []
    }

    return raw.map((row) => OutboxPendingRowMapper.parseRow(row))
  }

  static parseRow(raw: unknown): OutboxPendingRow {
    if (!ObjectUtils.isPlainObject(raw)) {
      throw new Error('Invalid outbox row')
    }

    return {
      id: OutboxPendingRowMapper.readString(raw, 'id'),
      event_type: OutboxPendingRowMapper.readString(raw, 'event_type'),
      payload: OutboxPendingRowMapper.readPayload(raw.payload),
      tenant_id: OutboxPendingRowMapper.readNullableString(raw.tenant_id),
      status: OutboxPendingRowMapper.readString(raw, 'status'),
      created_at: OutboxPendingRowMapper.readDate(raw.created_at, 'created_at'),
      processed_at: OutboxPendingRowMapper.readNullableDate(raw.processed_at),
      attempt_count: OutboxPendingRowMapper.readNumber(raw.attempt_count, 'attempt_count'),
    }
  }

  static toEntity(row: OutboxPendingRow): OutboxEntryEntity {
    const entity = new OutboxEntryEntity()

    entity.id = row.id
    entity.eventType = row.event_type
    entity.payload = row.payload
    entity.tenantId = row.tenant_id
    entity.status = OutboxStatus.parse('processing')
    entity.createdAt = row.created_at
    entity.processedAt = row.processed_at
    entity.attemptCount = row.attempt_count

    return entity
  }

  private static readString(record: Record<string, unknown>, key: string): string {
    const value = record[key]

    if (!TypeScriptUtils.isString(value)) {
      throw new Error(`Outbox row field ${key} must be a string`)
    }

    return value
  }

  private static readNullableString(value: unknown): string | null {
    if (value === null) {
      return null
    }

    if (!TypeScriptUtils.isString(value)) {
      throw new Error('Outbox row field tenant_id must be a string or null')
    }

    return value
  }

  private static readPayload(value: unknown): Record<string, unknown> {
    if (!ObjectUtils.isPlainObject(value)) {
      throw new Error('Outbox row field payload must be an object')
    }

    return value
  }

  private static readNumber(value: unknown, key: string): number {
    if (!TypeScriptUtils.isNumber(value)) {
      throw new Error(`Outbox row field ${key} must be a number`)
    }

    return value
  }

  private static readDate(value: unknown, key: string): Date {
    if (value instanceof Date) {
      return value
    }

    if (TypeScriptUtils.isString(value)) {
      return new Date(value)
    }

    throw new Error(`Outbox row field ${key} must be a date`)
  }

  private static readNullableDate(value: unknown): Date | null {
    if (value === null) {
      return null
    }

    return OutboxPendingRowMapper.readDate(value, 'processed_at')
  }
}
