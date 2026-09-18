import {Column, Entity, PrimaryColumn} from 'typeorm'

import {AuditableEntity} from '../../../kernel/persistence/auditable.entity'

@Entity({name: 'password_reset_tokens'})
export class PasswordResetTokenEntity extends AuditableEntity {
  @PrimaryColumn({name: 'user_id', type: 'uuid'})
  userId!: string

  @Column({name: 'token_hash', type: 'text', unique: true})
  tokenHash!: string

  @Column({name: 'expires_at', type: 'timestamptz'})
  expiresAt!: Date

  @Column({name: 'consumed_at', type: 'timestamptz', nullable: true})
  consumedAt!: Date | null
}
