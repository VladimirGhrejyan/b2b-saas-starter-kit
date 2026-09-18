import {Column, Entity, PrimaryColumn} from 'typeorm'

import {AuditableEntity} from '../../../kernel/persistence/auditable.entity'

@Entity({name: 'user_local_passwords'})
export class LocalPasswordEntity extends AuditableEntity {
  @PrimaryColumn({name: 'user_id', type: 'uuid'})
  userId!: string

  @Column({name: 'password_hash', type: 'text'})
  passwordHash!: string
}
