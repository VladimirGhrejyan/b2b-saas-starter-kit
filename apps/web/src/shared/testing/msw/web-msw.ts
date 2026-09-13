import {http, HttpResponse} from 'msw'
import {setupServer} from 'msw/node'

import {HttpStatus} from '@b2b-saas-starter-kit/contracts'

import {
  forbiddenError,
  invalidCredentialsError,
  memberAuthSession,
  memberMe,
  ownerAuthSession,
  ownerMe,
  ownerMembers,
  unauthorizedError,
} from './fixtures'

export class WebMsw {
  static readonly server = setupServer()

  private static started = false

  static listen(): void {
    if (WebMsw.started) {
      return
    }

    WebMsw.server.listen({onUnhandledRequest: 'error'})
    WebMsw.started = true
  }

  static reset(): void {
    WebMsw.server.resetHandlers()
  }

  static close(): void {
    WebMsw.server.close()
    WebMsw.started = false
  }

  static useOwner(): void {
    WebMsw.server.use(
      http.get('http://web.test/v1/me', () => HttpResponse.json(ownerMe)),
      http.get('http://web.test/v1/tenants/:tenantId/members', () => HttpResponse.json(ownerMembers)),
      http.post('http://web.test/v1/auth/web/login', () => HttpResponse.json(ownerAuthSession)),
      http.post('http://web.test/v1/auth/web/refresh', () => HttpResponse.json(ownerAuthSession)),
    )
  }

  static useMember(): void {
    WebMsw.server.use(
      http.get('http://web.test/v1/me', () => HttpResponse.json(memberMe)),
      http.get('http://web.test/v1/tenants/:tenantId/members', () =>
        HttpResponse.json(forbiddenError, {status: HttpStatus.FORBIDDEN}),
      ),
      http.post('http://web.test/v1/auth/web/login', () => HttpResponse.json(memberAuthSession)),
      http.post('http://web.test/v1/auth/web/refresh', () => HttpResponse.json(memberAuthSession)),
    )
  }

  static useUnauthorized(): void {
    WebMsw.server.use(
      http.get('http://web.test/v1/me', () => HttpResponse.json(unauthorizedError, {status: HttpStatus.UNAUTHORIZED})),
      http.get('http://web.test/v1/tenants/:tenantId/members', () =>
        HttpResponse.json(unauthorizedError, {status: HttpStatus.UNAUTHORIZED}),
      ),
      http.post('http://web.test/v1/auth/web/refresh', () =>
        HttpResponse.json(unauthorizedError, {status: HttpStatus.UNAUTHORIZED}),
      ),
    )
  }

  static useInvalidLogin(): void {
    WebMsw.server.use(
      http.post('http://web.test/v1/auth/web/login', () =>
        HttpResponse.json(invalidCredentialsError, {status: HttpStatus.UNAUTHORIZED}),
      ),
    )
  }

  static useForbiddenMembers(): void {
    WebMsw.server.use(
      http.get('http://web.test/v1/me', () => HttpResponse.json(ownerMe)),
      http.get('http://web.test/v1/tenants/:tenantId/members', () =>
        HttpResponse.json(forbiddenError, {status: HttpStatus.FORBIDDEN}),
      ),
      http.post('http://web.test/v1/auth/web/refresh', () => HttpResponse.json(ownerAuthSession)),
    )
  }
}
