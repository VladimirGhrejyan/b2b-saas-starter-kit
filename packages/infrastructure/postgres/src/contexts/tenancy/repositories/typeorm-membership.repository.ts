import {Inject, Injectable} from '@nestjs/common'
import type {DataSource} from 'typeorm'

import type {MembershipId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {Membership, MembershipRepository} from '@b2b-saas-starter-kit/domain'

import type {TenantContext} from '@b2b-saas-starter-kit/platform'
import {TENANT_CONTEXT} from '@b2b-saas-starter-kit/platform'

import {ChildCollectionWriter} from '../../../kernel/persistence/child-collection.writer'
import {TenantAwareRepository} from '../../../kernel/persistence/tenant-aware.repository'
import {DATA_SOURCE} from '../../../kernel/tokens'
import {MembershipEntity} from '../entities/membership.entity'
import {MembershipRoleEntity} from '../entities/membership-role.entity'
import {MembershipMapper} from '../mappers/membership.mapper'

/**
 * TypeORM {@link MembershipRepository}. Role ids are uuid columns, not a join to authorization.
 */
@Injectable()
export class TypeOrmMembershipRepository extends TenantAwareRepository implements MembershipRepository {
  constructor(@Inject(DATA_SOURCE) dataSource: DataSource, @Inject(TENANT_CONTEXT) tenantContext: TenantContext) {
    super(dataSource, tenantContext)
  }

  async findById(id: MembershipId): Promise<Membership | null> {
    const row = await this.scoped(
      'membership',
      this.manager
        .createQueryBuilder(MembershipEntity, 'membership')
        .leftJoinAndSelect('membership.roleRows', 'roleRow')
        .where('membership.id = :id', {id}),
    ).getOne()

    return row === null ? null : MembershipMapper.toDomain(row)
  }

  async findByTenant(tenantId: TenantId): Promise<Membership[]> {
    this.assertTenant(tenantId)

    const rows = await this.scoped(
      'membership',
      this.manager
        .createQueryBuilder(MembershipEntity, 'membership')
        .leftJoinAndSelect('membership.roleRows', 'roleRow')
        .where('membership.tenantId = :tenantId', {tenantId})
        .orderBy('membership.id', 'ASC'),
    ).getMany()

    return rows.map((row) => MembershipMapper.toDomain(row))
  }

  async findByTenantAndRole(tenantId: TenantId, roleId: RoleId): Promise<Membership[]> {
    this.assertTenant(tenantId)

    const rows = await this.scoped(
      'membership',
      this.manager
        .createQueryBuilder(MembershipEntity, 'membership')
        .innerJoin('membership.roleRows', 'filterRole', 'filterRole.roleId = :roleId', {roleId})
        .leftJoinAndSelect('membership.roleRows', 'roleRow')
        .where('membership.tenantId = :tenantId', {tenantId})
        .orderBy('membership.id', 'ASC'),
    ).getMany()

    return rows.map((row) => MembershipMapper.toDomain(row))
  }

  async findByUser(userId: UserId): Promise<Membership[]> {
    return this.withoutTenantScope(async () => {
      const rows = await this.manager
        .createQueryBuilder(MembershipEntity, 'membership')
        .leftJoinAndSelect('membership.roleRows', 'roleRow')
        .where('membership.userId = :userId', {userId})
        .orderBy('membership.id', 'ASC')
        .getMany()

      return rows.map((row) => MembershipMapper.toDomain(row))
    })
  }

  async findByUserAndTenant(userId: UserId, tenantId: TenantId): Promise<Membership | null> {
    if (this.hasEstablishedTenantScope()) {
      this.assertTenant(tenantId)
    }

    return this.withoutTenantScope(async () => {
      const row = await this.manager
        .createQueryBuilder(MembershipEntity, 'membership')
        .leftJoinAndSelect('membership.roleRows', 'roleRow')
        .where('membership.userId = :userId', {userId})
        .andWhere('membership.tenantId = :tenantId', {tenantId})
        .getOne()

      return row === null ? null : MembershipMapper.toDomain(row)
    })
  }

  async save(membership: Membership): Promise<void> {
    const mapped = this.stampTenantId(MembershipMapper.toEntity(membership))
    const writer = new ChildCollectionWriter(this.manager)

    await writer.saveVersionedParentAndReplaceChildren({
      parentEntity: MembershipEntity,
      parentId: mapped.id,
      entityName: 'Membership',
      buildParent: () => {
        const row = new MembershipEntity()

        row.id = mapped.id
        row.tenantId = mapped.tenantId
        row.userId = mapped.userId
        row.status = mapped.status

        return row
      },
      children: {
        childEntity: MembershipRoleEntity,
        parentIdColumn: 'membershipId',
        parentId: mapped.id,
        buildChildren: () =>
          mapped.roleRows.map((roleRow) => {
            const child = new MembershipRoleEntity()

            child.membershipId = mapped.id
            child.roleId = roleRow.roleId

            return child
          }),
      },
    })
  }
}
