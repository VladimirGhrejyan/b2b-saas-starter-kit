import {HttpMethod} from '@b2b-saas-starter-kit/contracts'

import type {RouteMetadata} from '@b2b-saas-starter-kit/nest-http'

export const TenantsRoutes = {
  create: {
    method: HttpMethod.POST,
    path: 'tenants',
    summary: 'Create a tenant',
    operationId: 'createTenant',
    tags: ['tenants'],
  } satisfies RouteMetadata,
  get: {
    method: HttpMethod.GET,
    path: 'tenants/:tenantId',
    summary: 'Get a tenant',
    operationId: 'getTenant',
    tags: ['tenants'],
  } satisfies RouteMetadata,
}
