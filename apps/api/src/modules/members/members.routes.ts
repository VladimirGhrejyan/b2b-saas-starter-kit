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
}
