import {Inject, Injectable} from '@nestjs/common'
import type {DataSource} from 'typeorm'

import type {InvitationId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {Invitation, InvitationRepository} from '@b2b-saas-starter-kit/domain'

import type {TenantContext} from '@b2b-saas-starter-kit/platform'

import {TenantAwareRepository} from '../../../kernel/persistence/tenant-aware.repository'
import {DATA_SOURCE, TENANT_CONTEXT} from '../../../kernel/tokens'
import {InvitationEntity} from '../entities/invitation.entity'
import {InvitationRoleEntity} from '../entities/invitation-role.entity'
import {InvitationMapper} from '../mappers/invitation.mapper'

/**
 * TypeORM {@link InvitationRepository}. Role ids are uuid columns, not a join to authorization.
 */
@Injectable()
export class TypeOrmInvitationRepository extends TenantAwareRepository implements InvitationRepository {
  constructor(@Inject(DATA_SOURCE) dataSource: DataSource, @Inject(TENANT_CONTEXT) tenantContext: TenantContext) {
    super(dataSource, tenantContext)
  }

  async findById(id: InvitationId): Promise<Invitation | null> {
    const row = await this.scoped(
      'invitation',
      this.manager
        .createQueryBuilder(InvitationEntity, 'invitation')
        .leftJoinAndSelect('invitation.roleRows', 'roleRow')
        .where('invitation.id = :id', {id}),
    ).getOne()

    return row === null ? null : InvitationMapper.toDomain(row)
  }

  async findActiveByTenantAndEmail(tenantId: TenantId, email: string): Promise<Invitation | null> {
    const row = await this.scoped(
      'invitation',
      this.manager
        .createQueryBuilder(InvitationEntity, 'invitation')
        .leftJoinAndSelect('invitation.roleRows', 'roleRow')
        .where('invitation.tenantId = :tenantId', {tenantId})
        .andWhere('invitation.email = :email', {email})
        .andWhere('invitation.consumedAt IS NULL'),
    ).getOne()

    return row === null ? null : InvitationMapper.toDomain(row)
  }

  async findByTokenHash(tokenHash: string): Promise<Invitation | null> {
    return this.withoutTenantScope(async () => {
      const row = await this.manager
        .createQueryBuilder(InvitationEntity, 'invitation')
        .leftJoinAndSelect('invitation.roleRows', 'roleRow')
        .where('invitation.tokenHash = :tokenHash', {tokenHash})
        .getOne()

      return row === null ? null : InvitationMapper.toDomain(row)
    })
  }

  async save(invitation: Invitation): Promise<void> {
    const stamped = this.stampTenantId(InvitationMapper.toEntity(invitation))

    await this.manager.upsert(
      InvitationEntity,
      {
        id: stamped.id,
        tenantId: stamped.tenantId,
        email: stamped.email,
        tokenHash: stamped.tokenHash,
        expiresAt: stamped.expiresAt,
        invitedByUserId: stamped.invitedByUserId,
        consumedAt: stamped.consumedAt,
      },
      {conflictPaths: ['id']},
    )

    await this.manager.delete(InvitationRoleEntity, {invitationId: stamped.id})

    if (stamped.roleRows.length === 0) {
      return
    }

    await this.manager.insert(
      InvitationRoleEntity,
      stamped.roleRows.map((roleRow) => ({invitationId: stamped.id, roleId: roleRow.roleId})),
    )
  }
}
