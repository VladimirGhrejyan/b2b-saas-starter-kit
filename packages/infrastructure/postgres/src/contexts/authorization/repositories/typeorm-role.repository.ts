import {Inject, Injectable} from '@nestjs/common'
import type {DataSource} from 'typeorm'

import type {RoleId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'
import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

import type {Role, RoleRepository} from '@b2b-saas-starter-kit/domain'

import type {TenantContext} from '@b2b-saas-starter-kit/platform'
import {TENANT_CONTEXT} from '@b2b-saas-starter-kit/platform'

import {ChildCollectionWriter} from '../../../kernel/persistence/child-collection.writer'
import {TenantAwareRepository} from '../../../kernel/persistence/tenant-aware.repository'
import {DATA_SOURCE} from '../../../kernel/tokens'
import {RoleEntity} from '../entities/role.entity'
import {RolePermissionEntity} from '../entities/role-permission.entity'
import {RoleMapper} from '../mappers/role.mapper'

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

  async findByIds(ids: readonly RoleId[]): Promise<Role[]> {
    if (TypeScriptUtils.isEmpty(ids)) {
      return []
    }

    const rows = await this.scoped(
      'role',
      this.manager
        .createQueryBuilder(RoleEntity, 'role')
        .leftJoinAndSelect('role.permissions', 'permission')
        .where('role.id IN (:...ids)', {ids: [...ids]}),
    ).getMany()

    return rows.map((row) => RoleMapper.toDomain(row))
  }

  async findByTenant(tenantId: TenantId): Promise<Role[]> {
    this.assertTenant(tenantId)

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
    const mapped = this.stampTenantId(RoleMapper.toEntity(role))
    const writer = new ChildCollectionWriter(this.manager)

    await writer.saveVersionedParentAndReplaceChildren({
      parentEntity: RoleEntity,
      parentId: mapped.id,
      entityName: 'Role',
      buildParent: () => {
        const row = new RoleEntity()

        row.id = mapped.id
        row.tenantId = mapped.tenantId
        row.name = mapped.name
        row.isSystem = mapped.isSystem

        return row
      },
      children: {
        childEntity: RolePermissionEntity,
        parentIdColumn: 'roleId',
        parentId: mapped.id,
        buildChildren: () =>
          mapped.permissions.map((permissionRow) => {
            const child = new RolePermissionEntity()

            child.roleId = mapped.id
            child.permission = permissionRow.permission

            return child
          }),
      },
    })
  }

  async saveMany(roles: Role[]): Promise<void> {
    for (const role of roles) {
      await this.save(role)
    }
  }

  async delete(id: RoleId): Promise<void> {
    const role = await this.findById(id)

    if (role === null) {
      return
    }

    const writer = new ChildCollectionWriter(this.manager)

    await writer.deleteParentAndChildren({
      parentEntity: RoleEntity,
      parentId: id,
      childEntity: RolePermissionEntity,
      parentIdColumn: 'roleId',
    })
  }
}
