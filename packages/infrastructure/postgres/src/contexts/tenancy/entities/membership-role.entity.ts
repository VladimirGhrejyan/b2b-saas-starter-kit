import {Entity, JoinColumn, ManyToOne, PrimaryColumn} from 'typeorm'

import {AuditableEntity} from '../../../kernel/persistence/auditable.entity'

import {MembershipEntity} from './membership.entity'

@Entity({name: 'membership_roles'})
export class MembershipRoleEntity extends AuditableEntity {
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
