import {Column, Entity, PrimaryColumn} from 'typeorm'

import {AuditableEntity} from '../../../kernel/persistence/auditable.entity'

@Entity({name: 'api_keys'})
export class ApiKeyEntity extends AuditableEntity {
  @PrimaryColumn({type: 'uuid'})
  id!: string

  @Column({name: 'tenant_id', type: 'uuid'})
  tenantId!: string

  @Column({name: 'created_by_user_id', type: 'uuid'})
  createdByUserId!: string

  @Column({type: 'text'})
  name!: string

  @Column({type: 'text', unique: true})
  prefix!: string

  @Column({name: 'secret_hash', type: 'text', unique: true})
  secretHash!: string

  @Column({type: 'text', array: true})
  permissions!: string[]

  @Column({name: 'expires_at', type: 'timestamptz', nullable: true})
  expiresAt!: Date | null

  @Column({name: 'revoked_at', type: 'timestamptz', nullable: true})
  revokedAt!: Date | null

  @Column({name: 'last_used_at', type: 'timestamptz', nullable: true})
  lastUsedAt!: Date | null
}
