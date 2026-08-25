import {TenantId, TenantStatus} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Tenant} from '@b2b-saas-starter-kit/domain'

import {TenantEntity} from './tenant.entity'

export const TenantMapper = {
  toDomain(row: TenantEntity): Tenant {
    return Tenant.reconstitute({
      id: TenantId.parse(row.id),
      name: row.name,
      status: TenantStatus.parse(row.status),
    })
  },

  toEntity(tenant: Tenant): TenantEntity {
    const row = new TenantEntity()

    row.id = tenant.id
    row.tenantId = tenant.id
    row.name = tenant.name
    row.status = tenant.status

    return row
  },
}
