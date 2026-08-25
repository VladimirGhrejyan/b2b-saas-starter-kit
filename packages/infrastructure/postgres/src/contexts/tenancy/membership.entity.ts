import {Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, Unique} from 'typeorm'

import type {MembershipRoleEntity} from './membership-role.entity'
import {TenantEntity} from './tenant.entity'

@Entity({name: 'memberships'})
@Unique('uq_memberships_tenant_id_user_id', ['tenantId', 'userId'])
export class MembershipEntity {
  @PrimaryColumn({type: 'uuid'})
  id!: string

  @Column({name: 'tenant_id', type: 'uuid'})
  tenantId!: string

  @Column({name: 'user_id', type: 'uuid'})
  userId!: string

  @Column({type: 'text'})
  status!: string

  @ManyToOne(() => TenantEntity, {nullable: false, createForeignKeyConstraints: false})
  @JoinColumn({name: 'tenant_id'})
  tenant?: TenantEntity

  @OneToMany('MembershipRoleEntity', 'membership')
  roleRows!: MembershipRoleEntity[]
}
