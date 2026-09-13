import {HttpMethod} from '@b2b-saas-starter-kit/contracts'

import type {RouteMetadata} from '@b2b-saas-starter-kit/nest-http'

export const RolesRoutes = {
  list: {
    method: HttpMethod.GET,
    path: 'tenants/:tenantId/roles',
    summary: 'List tenant roles',
    operationId: 'listRoles',
    tags: ['roles'],
  } satisfies RouteMetadata,
  create: {
    method: HttpMethod.POST,
    path: 'tenants/:tenantId/roles',
    summary: 'Create a custom role',
    operationId: 'createCustomRole',
    tags: ['roles'],
  } satisfies RouteMetadata,
  update: {
    method: HttpMethod.PATCH,
    path: 'tenants/:tenantId/roles/:roleId',
    summary: 'Update a custom role',
    operationId: 'updateCustomRole',
    tags: ['roles'],
  } satisfies RouteMetadata,
  delete: {
    method: HttpMethod.DELETE,
    path: 'tenants/:tenantId/roles/:roleId',
    summary: 'Delete a custom role',
    operationId: 'deleteCustomRole',
    tags: ['roles'],
  } satisfies RouteMetadata,
}
