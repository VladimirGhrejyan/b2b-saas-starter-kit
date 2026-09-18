import {Column, Entity, Index, PrimaryColumn, Unique} from 'typeorm'

import {AuditableEntity} from '../persistence/auditable.entity'

import type {IdempotencyRecordStatus} from './idempotency-record-status'

@Entity({name: 'idempotency_keys'})
@Unique('uq_idempotency_keys_scope_endpoint_key', ['scope', 'endpoint', 'idempotencyKey'])
@Index('idx_idempotency_keys_expires_at', ['expiresAt'])
export class IdempotencyKeyEntity extends AuditableEntity {
  @PrimaryColumn({type: 'uuid'})
  id!: string

  @Column({type: 'text'})
  scope!: string

  @Column({type: 'text'})
  endpoint!: string

  @Column({name: 'idempotency_key', type: 'text'})
  idempotencyKey!: string

  @Column({name: 'request_fingerprint', type: 'text'})
  requestFingerprint!: string

  @Column({type: 'text'})
  status!: IdempotencyRecordStatus

  @Column({name: 'response_status', type: 'int', nullable: true})
  responseStatus!: number | null

  @Column({name: 'response_body', type: 'jsonb', nullable: true})
  responseBody!: unknown

  @Column({name: 'expires_at', type: 'timestamptz'})
  expiresAt!: Date

  @Column({name: 'tenant_id', type: 'uuid', nullable: true})
  tenantId!: string | null

  @Column({name: 'actor_id', type: 'uuid', nullable: true})
  actorId!: string | null
}
