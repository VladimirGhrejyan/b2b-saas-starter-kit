import {Column, Entity, OneToMany, PrimaryColumn, Unique} from 'typeorm'

import {VersionedEntity} from '../../../kernel/persistence/versioned.entity'

import type {RolePermissionEntity} from './role-permission.entity'

@Entity({name: 'roles'})
@Unique('uq_roles_tenant_id_name', ['tenantId', 'name'])
export class RoleEntity extends VersionedEntity {
  @PrimaryColumn({type: 'uuid'})
  id!: string

  @Column({name: 'tenant_id', type: 'uuid'})
  tenantId!: string

  @Column({type: 'text'})
  name!: string

  @Column({name: 'is_system', type: 'boolean'})
  isSystem!: boolean

  @OneToMany('RolePermissionEntity', 'role')
  permissions!: RolePermissionEntity[]
}
