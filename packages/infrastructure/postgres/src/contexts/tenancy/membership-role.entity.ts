import {Entity, JoinColumn, ManyToOne, PrimaryColumn} from 'typeorm'

import {MembershipEntity} from './membership.entity'

@Entity({name: 'membership_roles'})
export class MembershipRoleEntity {
  @PrimaryColumn({name: 'membership_id', type: 'uuid'})
  membershipId!: string

  @PrimaryColumn({name: 'role_id', type: 'uuid'})
  roleId!: string

  @ManyToOne(() => MembershipEntity, (membership) => membership.roleRows, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn({name: 'membership_id'})
  membership!: MembershipEntity
}
