import {HttpMethod} from '@b2b-saas-starter-kit/contracts'

import type {RouteMetadata} from '@b2b-saas-starter-kit/nest-http'

export const UsersRoutes = {
  create: {
    method: HttpMethod.POST,
    path: 'users',
    summary: 'Create a user',
    operationId: 'createUser',
    tags: ['users'],
  } satisfies RouteMetadata,
}
