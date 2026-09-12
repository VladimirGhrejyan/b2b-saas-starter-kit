import {Column, Entity, PrimaryColumn} from 'typeorm'

@Entity({name: 'refresh_sessions'})
export class RefreshSessionEntity {
  @PrimaryColumn({type: 'uuid'})
  id!: string

  @Column({name: 'user_id', type: 'uuid'})
  userId!: string

  @Column({name: 'family_id', type: 'uuid'})
  familyId!: string

  @Column({name: 'token_hash', type: 'text', unique: true})
  tokenHash!: string

  @Column({name: 'expires_at', type: 'timestamptz'})
  expiresAt!: Date

  @Column({name: 'revoked_at', type: 'timestamptz', nullable: true})
  revokedAt!: Date | null
}
