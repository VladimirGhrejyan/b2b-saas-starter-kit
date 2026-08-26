import {HttpMethod} from '@b2b-saas-starter-kit/contracts'

import type {RouteMetadata} from '@b2b-saas-starter-kit/nest-http'

export const MeRoutes = {
  get: {
    method: HttpMethod.GET,
    path: 'me',
    summary: 'Get the current user profile',
    operationId: 'getMe',
    tags: ['me'],
  } satisfies RouteMetadata,
}
