import {HttpMethod} from '@b2b-saas-starter-kit/contracts'

import type {RouteMetadata} from '@b2b-saas-starter-kit/nest-http'

export const MembersRoutes = {
  list: {
    method: HttpMethod.GET,
    path: 'tenants/:tenantId/members',
    summary: 'List tenant members',
    operationId: 'listTenantMembers',
    tags: ['members'],
  } satisfies RouteMetadata,
  attach: {
    method: HttpMethod.POST,
    path: 'tenants/:tenantId/members',
    summary: 'Attach an existing user as a member',
    operationId: 'attachMember',
    tags: ['members'],
  } satisfies RouteMetadata,
  replaceRoles: {
    method: HttpMethod.PATCH,
    path: 'tenants/:tenantId/memberships/:membershipId/roles',
    summary: 'Replace membership roles',
    operationId: 'replaceMembershipRoles',
    tags: ['members'],
  } satisfies RouteMetadata,
}
