import {Column, Entity, PrimaryColumn} from 'typeorm'

@Entity({name: 'users'})
export class UserEntity {
  @PrimaryColumn({type: 'uuid'})
  id!: string

  @Column({name: 'email', type: 'text', unique: true})
  email!: string

  @Column({name: 'display_name', type: 'text'})
  displayName!: string

  @Column({type: 'text'})
  status!: string
}
