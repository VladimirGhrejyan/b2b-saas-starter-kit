import {Injectable} from '@nestjs/common'

import type {TenantRepository} from '@b2b-saas-starter-kit/domain'
import {PermissionCatalog} from '@b2b-saas-starter-kit/domain'

import type {AuthorizationPort} from '../../shared/authorization.port'
import {TenantNotFoundError} from '../errors/tenant-not-found.error'

import type {GetTenantQueryInput, GetTenantResult} from './get-tenant.types'

/**
 * Returns `{ id, name }` for a tenant. Requires `tenancy.tenant.read`.
 */
@Injectable()
export class GetTenantQuery {
  constructor(
    private readonly authz: AuthorizationPort,
    private readonly tenants: TenantRepository,
  ) {}

  async execute(query: GetTenantQueryInput): Promise<GetTenantResult> {
    await this.authz.require(query.actorId, PermissionCatalog.tenancyTenantRead, {tenantId: query.tenantId})

    const tenant = await this.tenants.findById(query.tenantId)

    if (tenant === null) {
      throw new TenantNotFoundError()
    }

    return {id: tenant.id, name: tenant.name}
  }
}
