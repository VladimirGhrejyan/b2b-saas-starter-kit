import {Column, Entity, PrimaryColumn} from 'typeorm'

import {AuditableEntity} from '../persistence/auditable.entity'

import type {OutboxStatus} from './outbox-status'

@Entity({name: 'outbox'})
export class OutboxEntryEntity extends AuditableEntity {
  @PrimaryColumn({type: 'uuid'})
  id!: string

  @Column({name: 'event_type', type: 'text'})
  eventType!: string

  @Column({type: 'jsonb'})
  payload!: Record<string, unknown>

  @Column({name: 'tenant_id', type: 'uuid', nullable: true})
  tenantId!: string | null

  @Column({type: 'text'})
  status!: OutboxStatus

  @Column({name: 'processed_at', type: 'timestamptz', nullable: true})
  processedAt!: Date | null

  @Column({name: 'attempt_count', type: 'int', default: 0})
  attemptCount!: number
}
