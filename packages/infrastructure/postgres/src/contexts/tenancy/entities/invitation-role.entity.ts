import {Entity, JoinColumn, ManyToOne, PrimaryColumn} from 'typeorm'

import {AuditableEntity} from '../../../kernel/persistence/auditable.entity'

import {InvitationEntity} from './invitation.entity'

@Entity({name: 'invitation_roles'})
export class InvitationRoleEntity extends AuditableEntity {
  @PrimaryColumn({name: 'invitation_id', type: 'uuid'})
  invitationId!: string

  @PrimaryColumn({name: 'role_id', type: 'uuid'})
  roleId!: string

  @ManyToOne(() => InvitationEntity, (invitation) => invitation.roleRows, {
    onDelete: 'CASCADE',
    createForeignKeyConstraints: false,
  })
  @JoinColumn({name: 'invitation_id'})
  invitation!: InvitationEntity
}
