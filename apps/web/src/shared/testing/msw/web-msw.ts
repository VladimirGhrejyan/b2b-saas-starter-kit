import {http, HttpResponse} from 'msw'
import {setupServer} from 'msw/node'

import {HttpStatus} from '@b2b-saas-starter-kit/contracts'

import {forbiddenError, memberMe, ownerMe, ownerMembers, unauthorizedError} from './fixtures'

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
    )
  }

  static useMember(): void {
    WebMsw.server.use(
      http.get('http://web.test/v1/me', () => HttpResponse.json(memberMe)),
      http.get('http://web.test/v1/tenants/:tenantId/members', () =>
        HttpResponse.json(forbiddenError, {status: HttpStatus.FORBIDDEN}),
      ),
    )
  }

  static useUnauthorized(): void {
    WebMsw.server.use(
      http.get('http://web.test/v1/me', () => HttpResponse.json(unauthorizedError, {status: HttpStatus.UNAUTHORIZED})),
      http.get('http://web.test/v1/tenants/:tenantId/members', () =>
        HttpResponse.json(unauthorizedError, {status: HttpStatus.UNAUTHORIZED}),
      ),
    )
  }

  static useForbiddenMembers(): void {
    WebMsw.server.use(
      http.get('http://web.test/v1/me', () => HttpResponse.json(ownerMe)),
      http.get('http://web.test/v1/tenants/:tenantId/members', () =>
        HttpResponse.json(forbiddenError, {status: HttpStatus.FORBIDDEN}),
      ),
    )
  }
}
