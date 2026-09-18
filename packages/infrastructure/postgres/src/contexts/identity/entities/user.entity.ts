import {Column, Entity, PrimaryColumn} from 'typeorm'

import {AuditableEntity} from '../../../kernel/persistence/auditable.entity'

@Entity({name: 'users'})
export class UserEntity extends AuditableEntity {
  @PrimaryColumn({type: 'uuid'})
  id!: string

  @Column({name: 'email', type: 'text', unique: true})
  email!: string

  @Column({name: 'display_name', type: 'text'})
  displayName!: string

  @Column({type: 'text'})
  status!: string
}
