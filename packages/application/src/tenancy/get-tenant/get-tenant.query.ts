import {Inject, Injectable} from '@nestjs/common'

import type {TenantRepository} from '@b2b-saas-starter-kit/domain'
import {PermissionCatalog, TENANT_REPOSITORY} from '@b2b-saas-starter-kit/domain'

import type {AuthorizationPort} from '../../shared/authorization.port'
import {AUTHORIZATION} from '../../shared/authorization.port'
import {TenantNotFoundError} from '../errors/tenant-not-found.error'

import type {GetTenantQueryInput, GetTenantResult} from './get-tenant.types'

/**
 * Returns `{ id, name }` for a tenant. Requires `tenancy.tenant.read`.
 */
@Injectable()
export class GetTenantQuery {
  constructor(
    @Inject(AUTHORIZATION) private readonly authz: AuthorizationPort,
    @Inject(TENANT_REPOSITORY) private readonly tenants: TenantRepository,
  ) {}

  async execute(query: GetTenantQueryInput): Promise<GetTenantResult> {
    await this.authz.require(query.actor, PermissionCatalog.tenancyTenantRead, {tenantId: query.tenantId})

    const tenant = await this.tenants.findById(query.tenantId)

    if (tenant === null) {
      throw new TenantNotFoundError()
    }

    return {id: tenant.id, name: tenant.name}
  }
}
