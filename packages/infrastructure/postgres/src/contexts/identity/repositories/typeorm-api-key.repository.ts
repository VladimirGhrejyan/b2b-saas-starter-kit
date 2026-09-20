import {Inject, Injectable} from '@nestjs/common'
import type {DataSource} from 'typeorm'

import type {ApiKeyId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {ApiKey, ApiKeyRepository} from '@b2b-saas-starter-kit/domain'

import type {TenantContext} from '@b2b-saas-starter-kit/platform'
import {TENANT_CONTEXT} from '@b2b-saas-starter-kit/platform'

import {TenantAwareRepository} from '../../../kernel/persistence/tenant-aware.repository'
import {DATA_SOURCE} from '../../../kernel/tokens'
import {API_KEY_LAST_USED_TOUCH_MS} from '../api-key.constants'
import {ApiKeyEntity} from '../entities/api-key.entity'
import {ApiKeyMapper} from '../mappers/api-key.mapper'

/**
 * TypeORM {@link ApiKeyRepository}. `created_by_user_id` is a uuid column, not a join.
 */
@Injectable()
export class TypeOrmApiKeyRepository extends TenantAwareRepository implements ApiKeyRepository {
  constructor(@Inject(DATA_SOURCE) dataSource: DataSource, @Inject(TENANT_CONTEXT) tenantContext: TenantContext) {
    super(dataSource, tenantContext)
  }

  async findById(id: ApiKeyId): Promise<ApiKey | null> {
    const row = await this.scoped(
      'apiKey',
      this.manager.createQueryBuilder(ApiKeyEntity, 'apiKey').where('apiKey.id = :id', {id}),
    ).getOne()

    return row === null ? null : ApiKeyMapper.toDomain(row)
  }

  async findByPrefix(prefix: string): Promise<ApiKey | null> {
    return this.withoutTenantScope(async () => {
      const row = await this.manager
        .createQueryBuilder(ApiKeyEntity, 'apiKey')
        .where('apiKey.prefix = :prefix', {prefix})
        .getOne()

      return row === null ? null : ApiKeyMapper.toDomain(row)
    })
  }

  async findByTenant(tenantId: TenantId): Promise<readonly ApiKey[]> {
    this.assertTenant(tenantId)

    const rows = await this.scoped(
      'apiKey',
      this.manager.createQueryBuilder(ApiKeyEntity, 'apiKey').where('apiKey.tenantId = :tenantId', {tenantId}),
    ).getMany()

    return rows.map((row) => ApiKeyMapper.toDomain(row))
  }

  async save(apiKey: ApiKey): Promise<void> {
    const row = this.stampTenantId(ApiKeyMapper.toEntity(apiKey))
    const existing = await this.manager.findOneBy(ApiKeyEntity, {id: apiKey.id})

    if (existing !== null) {
      row.createdAt = existing.createdAt
    }

    await this.manager.save(ApiKeyEntity, row)
  }

  async touchLastUsed(id: ApiKeyId, at: Date): Promise<void> {
    const threshold = new Date(at.getTime() - API_KEY_LAST_USED_TOUCH_MS)

    await this.withoutTenantScope(async () => {
      await this.manager
        .createQueryBuilder()
        .update(ApiKeyEntity)
        .set({lastUsedAt: at})
        .where('id = :id', {id})
        .andWhere('(last_used_at IS NULL OR last_used_at < :threshold)', {threshold})
        .execute()
    })
  }
}
