import {HttpMethod} from '@b2b-saas-starter-kit/contracts'

import type {RouteMetadata} from '../decorators/route-metadata.types'

export const HealthRoutes = {
  live: {
    method: HttpMethod.GET,
    path: 'live',
    summary: 'Liveness probe',
    operationId: 'getLiveness',
    tags: ['Health'],
  },
  ready: {
    method: HttpMethod.GET,
    path: 'ready',
    summary: 'Readiness probe',
    operationId: 'getReadiness',
    tags: ['Health'],
  },
  health: {
    method: HttpMethod.GET,
    path: 'health',
    summary: 'Readiness probe (staging alias)',
    operationId: 'getHealth',
    tags: ['Health'],
  },
} as const satisfies Record<string, RouteMetadata>
