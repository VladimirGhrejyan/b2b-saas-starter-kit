import {HttpMethod} from '@b2b-saas-starter-kit/contracts'

import type {RouteMetadata} from '@b2b-saas-starter-kit/nest-http'

export const AuthRoutes = {
  register: {
    method: HttpMethod.POST,
    path: 'auth/register',
    summary: 'Register with email and password',
    operationId: 'registerUser',
    tags: ['auth'],
  } satisfies RouteMetadata,
  login: {
    method: HttpMethod.POST,
    path: 'auth/login',
    summary: 'Sign in with email and password',
    operationId: 'login',
    tags: ['auth'],
  } satisfies RouteMetadata,
  refresh: {
    method: HttpMethod.POST,
    path: 'auth/refresh',
    summary: 'Rotate the refresh cookie and issue a new access token',
    operationId: 'refreshSession',
    tags: ['auth'],
  } satisfies RouteMetadata,
  logout: {
    method: HttpMethod.POST,
    path: 'auth/logout',
    summary: 'Revoke the refresh family and clear the cookie',
    operationId: 'logout',
    tags: ['auth'],
  } satisfies RouteMetadata,
  selectTenant: {
    method: HttpMethod.POST,
    path: 'auth/select-tenant',
    summary: 'Issue an access token for an active membership',
    operationId: 'selectTenant',
    tags: ['auth'],
  } satisfies RouteMetadata,
  forgotPassword: {
    method: HttpMethod.POST,
    path: 'auth/forgot-password',
    summary: 'Request a password-reset token',
    operationId: 'forgotPassword',
    tags: ['auth'],
  } satisfies RouteMetadata,
  resetPassword: {
    method: HttpMethod.POST,
    path: 'auth/reset-password',
    summary: 'Reset a password with a mailed token',
    operationId: 'resetPassword',
    tags: ['auth'],
  } satisfies RouteMetadata,
}
