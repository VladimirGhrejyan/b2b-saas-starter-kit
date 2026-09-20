import {HttpMethod} from '@b2b-saas-starter-kit/contracts'

import type {RouteMetadata} from '@b2b-saas-starter-kit/nest-http'

export const ApiKeysRoutes = {
  create: {
    method: HttpMethod.POST,
    path: 'tenants/:tenantId/api-keys',
    summary: 'Create a tenant API key',
    operationId: 'createApiKey',
    tags: ['api-keys'],
  } satisfies RouteMetadata,
  list: {
    method: HttpMethod.GET,
    path: 'tenants/:tenantId/api-keys',
    summary: 'List tenant API keys',
    operationId: 'listApiKeys',
    tags: ['api-keys'],
  } satisfies RouteMetadata,
  update: {
    method: HttpMethod.PATCH,
    path: 'tenants/:tenantId/api-keys/:apiKeyId',
    summary: 'Update an API key',
    operationId: 'updateApiKey',
    tags: ['api-keys'],
  } satisfies RouteMetadata,
  revoke: {
    method: HttpMethod.DELETE,
    path: 'tenants/:tenantId/api-keys/:apiKeyId',
    summary: 'Revoke an API key',
    operationId: 'revokeApiKey',
    tags: ['api-keys'],
  } satisfies RouteMetadata,
}
