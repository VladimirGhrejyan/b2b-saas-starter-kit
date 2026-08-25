import {Inject, Injectable} from '@nestjs/common'
import type {DataSource} from 'typeorm'

import type {MembershipId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {Membership, MembershipRepository} from '@b2b-saas-starter-kit/domain'

import type {TenantContext} from '@b2b-saas-starter-kit/platform'

import {TenantAwareRepository} from '../../kernel/persistence/tenant-aware.repository'
import {DATA_SOURCE, TENANT_CONTEXT} from '../../kernel/tokens'

import {MembershipEntity} from './membership.entity'
import {MembershipMapper} from './membership.mapper'
import {MembershipRoleEntity} from './membership-role.entity'

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

  async findByUserAndTenant(userId: UserId, tenantId: TenantId): Promise<Membership | null> {
    const row = await this.scoped(
      'membership',
      this.manager
        .createQueryBuilder(MembershipEntity, 'membership')
        .leftJoinAndSelect('membership.roleRows', 'roleRow')
        .where('membership.userId = :userId', {userId})
        .andWhere('membership.tenantId = :tenantId', {tenantId}),
    ).getOne()

    return row === null ? null : MembershipMapper.toDomain(row)
  }

  async save(membership: Membership): Promise<void> {
    const stamped = this.stampTenantId(MembershipMapper.toEntity(membership))

    await this.manager.upsert(
      MembershipEntity,
      {id: stamped.id, tenantId: stamped.tenantId, userId: stamped.userId, status: stamped.status},
      {conflictPaths: ['id']},
    )

    await this.manager.delete(MembershipRoleEntity, {membershipId: stamped.id})

    if (stamped.roleRows.length === 0) {
      return
    }

    await this.manager.insert(
      MembershipRoleEntity,
      stamped.roleRows.map((roleRow) => ({membershipId: stamped.id, roleId: roleRow.roleId})),
    )
  }
}
