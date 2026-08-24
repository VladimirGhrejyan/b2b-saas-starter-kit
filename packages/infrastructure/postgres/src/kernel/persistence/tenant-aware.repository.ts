import type {DataSource, EntityManager, ObjectLiteral, SelectQueryBuilder} from 'typeorm'

import type {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {TenantContext} from '@b2b-saas-starter-kit/platform'

import {tenantAls} from '../tenant-context/tenant-als'
import {TenantContextMismatchError} from '../tenant-context/tenant-context-mismatch.error'

import {transactionAls} from './transaction-als'

/**
 * Base for tenant-owned repositories. Reads ambient {@link TenantContext} (fail-closed).
 */
export abstract class TenantAwareRepository {
  constructor(
    protected readonly dataSource: DataSource,
    protected readonly tenantContext: TenantContext,
  ) {}

  /**
   * Skips tenant filter/stamp for `work`. Verbose escape hatch for admin and pre-context lookups.
   */
  withoutTenantScope<T>(work: () => Promise<T>): Promise<T> {
    const store = tenantAls.getStore()

    return tenantAls.run({scope: store?.scope, skipTenantScope: true}, work)
  }

  protected get manager(): EntityManager {
    return transactionAls.getStore()?.manager ?? this.dataSource.manager
  }

  protected scoped<T extends ObjectLiteral>(alias: string, qb: SelectQueryBuilder<T>): SelectQueryBuilder<T> {
    if (this.#isTenantScopeSkipped()) {
      return qb
    }

    return qb.andWhere(`${alias}.tenantId = :tenantId`, {tenantId: this.tenantContext.getTenantId()})
  }

  protected stampTenantId<T>(row: T & {tenantId?: string}): T & {tenantId: string} {
    if (this.#isTenantScopeSkipped()) {
      if (row.tenantId === undefined) {
        throw new TenantContextMismatchError()
      }

      return {...row, tenantId: row.tenantId}
    }

    return {...row, tenantId: this.tenantContext.getTenantId()}
  }

  protected assertTenant(tenantId: TenantId): void {
    if (this.#isTenantScopeSkipped()) {
      return
    }

    if (this.tenantContext.getTenantId() !== tenantId) {
      throw new TenantContextMismatchError()
    }
  }

  #isTenantScopeSkipped(): boolean {
    return tenantAls.getStore()?.skipTenantScope === true
  }
}
