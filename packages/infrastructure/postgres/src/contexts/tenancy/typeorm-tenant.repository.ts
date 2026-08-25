import {Inject, Injectable} from '@nestjs/common'
import type {DataSource} from 'typeorm'

import type {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {Tenant, TenantRepository} from '@b2b-saas-starter-kit/domain'

import type {TenantContext} from '@b2b-saas-starter-kit/platform'

import {TenantAwareRepository} from '../../kernel/persistence/tenant-aware.repository'
import {DATA_SOURCE, TENANT_CONTEXT} from '../../kernel/tokens'

import {TenantEntity} from './tenant.entity'
import {TenantMapper} from './tenant.mapper'

/**
 * TypeORM {@link TenantRepository}. Reads are ambient-scoped; first-tenant writes may bootstrap.
 */
@Injectable()
export class TypeOrmTenantRepository extends TenantAwareRepository implements TenantRepository {
  constructor(@Inject(DATA_SOURCE) dataSource: DataSource, @Inject(TENANT_CONTEXT) tenantContext: TenantContext) {
    super(dataSource, tenantContext)
  }

  async findById(id: TenantId): Promise<Tenant | null> {
    const row = await this.scoped(
      'tenant',
      this.manager.createQueryBuilder(TenantEntity, 'tenant').where('tenant.id = :id', {id}),
    ).getOne()

    return row === null ? null : TenantMapper.toDomain(row)
  }

  async save(tenant: Tenant): Promise<void> {
    const stamped = this.stampTenantId(TenantMapper.toEntity(tenant))

    await this.manager.upsert(
      TenantEntity,
      {id: stamped.id, tenantId: stamped.tenantId, name: stamped.name, status: stamped.status},
      {conflictPaths: ['id']},
    )
  }
}
