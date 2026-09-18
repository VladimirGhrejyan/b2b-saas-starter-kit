import {Inject, Injectable} from '@nestjs/common'
import type {DataSource} from 'typeorm'

import type {InvitationId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {Invitation, InvitationRepository} from '@b2b-saas-starter-kit/domain'

import type {TenantContext} from '@b2b-saas-starter-kit/platform'
import {TENANT_CONTEXT} from '@b2b-saas-starter-kit/platform'

import {ChildCollectionWriter} from '../../../kernel/persistence/child-collection.writer'
import {TenantAwareRepository} from '../../../kernel/persistence/tenant-aware.repository'
import {DATA_SOURCE} from '../../../kernel/tokens'
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
    this.assertTenant(tenantId)

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
    const mapped = this.stampTenantId(InvitationMapper.toEntity(invitation))
    const writer = new ChildCollectionWriter(this.manager)

    await writer.saveAuditableParentAndReplaceChildren({
      parentEntity: InvitationEntity,
      parentId: mapped.id,
      buildParent: () => {
        const row = new InvitationEntity()

        row.id = mapped.id
        row.tenantId = mapped.tenantId
        row.email = mapped.email
        row.tokenHash = mapped.tokenHash
        row.expiresAt = mapped.expiresAt
        row.invitedByUserId = mapped.invitedByUserId
        row.consumedAt = mapped.consumedAt

        return row
      },
      children: {
        childEntity: InvitationRoleEntity,
        parentIdColumn: 'invitationId',
        parentId: mapped.id,
        buildChildren: () =>
          mapped.roleRows.map((roleRow) => {
            const child = new InvitationRoleEntity()

            child.invitationId = mapped.id
            child.roleId = roleRow.roleId

            return child
          }),
      },
    })
  }
}
