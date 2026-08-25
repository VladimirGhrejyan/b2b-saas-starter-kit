import {Entity, JoinColumn, ManyToOne, PrimaryColumn} from 'typeorm'

import {RoleEntity} from './role.entity'

@Entity({name: 'role_permissions'})
export class RolePermissionEntity {
  @PrimaryColumn({name: 'role_id', type: 'uuid'})
  roleId!: string

  @PrimaryColumn({type: 'text'})
  permission!: string

  @ManyToOne(() => RoleEntity, (role) => role.permissions, {onDelete: 'CASCADE', createForeignKeyConstraints: false})
  @JoinColumn({name: 'role_id'})
  role!: RoleEntity
}
