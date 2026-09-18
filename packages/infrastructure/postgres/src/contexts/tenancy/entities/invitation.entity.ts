import {Column, Entity, OneToMany, PrimaryColumn} from 'typeorm'

import {AuditableEntity} from '../../../kernel/persistence/auditable.entity'

import type {InvitationRoleEntity} from './invitation-role.entity'

@Entity({name: 'invitations'})
export class InvitationEntity extends AuditableEntity {
  @PrimaryColumn({type: 'uuid'})
  id!: string

  @Column({name: 'tenant_id', type: 'uuid'})
  tenantId!: string

  @Column({type: 'text'})
  email!: string

  @Column({name: 'token_hash', type: 'text', unique: true})
  tokenHash!: string

  @Column({name: 'expires_at', type: 'timestamptz'})
  expiresAt!: Date

  @Column({name: 'invited_by_user_id', type: 'uuid'})
  invitedByUserId!: string

  @Column({name: 'consumed_at', type: 'timestamptz', nullable: true})
  consumedAt!: Date | null

  @OneToMany('InvitationRoleEntity', 'invitation')
  roleRows!: InvitationRoleEntity[]
}
