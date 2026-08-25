import {Inject, Injectable} from '@nestjs/common'
import type {DataSource} from 'typeorm'

import type {RoleId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {Role, RoleRepository} from '@b2b-saas-starter-kit/domain'

import type {TenantContext} from '@b2b-saas-starter-kit/platform'

import {TenantAwareRepository} from '../../kernel/persistence/tenant-aware.repository'
import {DATA_SOURCE, TENANT_CONTEXT} from '../../kernel/tokens'

import {RoleEntity} from './role.entity'
import {RoleMapper} from './role.mapper'
import {RolePermissionEntity} from './role-permission.entity'

/**
 * TypeORM {@link RoleRepository}. Permissions are reconstituted through the catalog.
 */
@Injectable()
export class TypeOrmRoleRepository extends TenantAwareRepository implements RoleRepository {
  constructor(@Inject(DATA_SOURCE) dataSource: DataSource, @Inject(TENANT_CONTEXT) tenantContext: TenantContext) {
    super(dataSource, tenantContext)
  }

  async findById(id: RoleId): Promise<Role | null> {
    const row = await this.scoped(
      'role',
      this.manager
        .createQueryBuilder(RoleEntity, 'role')
        .leftJoinAndSelect('role.permissions', 'permission')
        .where('role.id = :id', {id}),
    ).getOne()

    return row === null ? null : RoleMapper.toDomain(row)
  }

  async findByTenant(tenantId: TenantId): Promise<Role[]> {
    const rows = await this.scoped(
      'role',
      this.manager
        .createQueryBuilder(RoleEntity, 'role')
        .leftJoinAndSelect('role.permissions', 'permission')
        .where('role.tenantId = :tenantId', {tenantId})
        .orderBy('role.name', 'ASC'),
    ).getMany()

    return rows.map((row) => RoleMapper.toDomain(row))
  }

  async save(role: Role): Promise<void> {
    const stamped = this.stampTenantId(RoleMapper.toEntity(role))

    await this.manager.upsert(
      RoleEntity,
      {id: stamped.id, tenantId: stamped.tenantId, name: stamped.name, isSystem: stamped.isSystem},
      {conflictPaths: ['id']},
    )

    await this.manager.delete(RolePermissionEntity, {roleId: stamped.id})

    if (stamped.permissions.length === 0) {
      return
    }

    await this.manager.insert(
      RolePermissionEntity,
      stamped.permissions.map((permissionRow) => ({roleId: stamped.id, permission: permissionRow.permission})),
    )
  }

  async saveMany(roles: Role[]): Promise<void> {
    for (const role of roles) {
      await this.save(role)
    }
  }
}
