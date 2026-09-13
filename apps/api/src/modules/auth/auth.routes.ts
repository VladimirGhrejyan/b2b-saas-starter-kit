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
    summary: 'Sign in and return access plus refresh tokens',
    operationId: 'login',
    tags: ['auth'],
  } satisfies RouteMetadata,
  refresh: {
    method: HttpMethod.POST,
    path: 'auth/refresh',
    summary: 'Rotate a refresh token from the request body',
    operationId: 'refreshSession',
    tags: ['auth'],
  } satisfies RouteMetadata,
  logout: {
    method: HttpMethod.POST,
    path: 'auth/logout',
    summary: 'Revoke the refresh family using a body token',
    operationId: 'logout',
    tags: ['auth'],
  } satisfies RouteMetadata,
  webLogin: {
    method: HttpMethod.POST,
    path: 'auth/web/login',
    summary: 'Sign in and set the refresh cookie',
    operationId: 'webLogin',
    tags: ['auth'],
  } satisfies RouteMetadata,
  webRefresh: {
    method: HttpMethod.POST,
    path: 'auth/web/refresh',
    summary: 'Rotate the refresh cookie and issue a new access token',
    operationId: 'webRefreshSession',
    tags: ['auth'],
  } satisfies RouteMetadata,
  webLogout: {
    method: HttpMethod.POST,
    path: 'auth/web/logout',
    summary: 'Revoke the refresh family and clear the cookie',
    operationId: 'webLogout',
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
  setOrChangePassword: {
    method: HttpMethod.POST,
    path: 'auth/password',
    summary: 'Set a missing local password or change the current one',
    operationId: 'setOrChangePassword',
    tags: ['auth'],
  } satisfies RouteMetadata,
}
