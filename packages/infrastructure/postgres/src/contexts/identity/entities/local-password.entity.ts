import {Column, Entity, PrimaryColumn} from 'typeorm'

@Entity({name: 'user_local_passwords'})
export class LocalPasswordEntity {
  @PrimaryColumn({name: 'user_id', type: 'uuid'})
  userId!: string

  @Column({name: 'password_hash', type: 'text'})
  passwordHash!: string
}
