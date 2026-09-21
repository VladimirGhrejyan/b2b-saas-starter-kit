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

export class FrontendMsw {
  static readonly defaultBaseUrl = 'http://web.test/v1'

  readonly server = setupServer()

  private started = false

  constructor(private readonly baseUrl = FrontendMsw.defaultBaseUrl) {}

  listen(): void {
    if (this.started) {
      return
    }

    this.server.listen({onUnhandledRequest: 'error'})
    this.started = true
  }

  reset(): void {
    this.server.resetHandlers()
  }

  close(): void {
    this.server.close()
    this.started = false
  }

  useOwner(): void {
    this.server.use(
      http.get(this.url('/me'), () => HttpResponse.json(ownerMe)),
      http.get(this.url('/tenants/:tenantId/members'), () => HttpResponse.json(ownerMembers)),
      http.post(this.url('/auth/web/login'), () => HttpResponse.json(ownerAuthSession)),
      http.post(this.url('/auth/web/refresh'), () => HttpResponse.json(ownerAuthSession)),
    )
  }

  useMember(): void {
    this.server.use(
      http.get(this.url('/me'), () => HttpResponse.json(memberMe)),
      http.get(this.url('/tenants/:tenantId/members'), () =>
        HttpResponse.json(forbiddenError, {status: HttpStatus.FORBIDDEN}),
      ),
      http.post(this.url('/auth/web/login'), () => HttpResponse.json(memberAuthSession)),
      http.post(this.url('/auth/web/refresh'), () => HttpResponse.json(memberAuthSession)),
    )
  }

  useUnauthorized(): void {
    this.server.use(
      http.get(this.url('/me'), () => HttpResponse.json(unauthorizedError, {status: HttpStatus.UNAUTHORIZED})),
      http.get(this.url('/tenants/:tenantId/members'), () =>
        HttpResponse.json(unauthorizedError, {status: HttpStatus.UNAUTHORIZED}),
      ),
      http.post(this.url('/auth/web/refresh'), () =>
        HttpResponse.json(unauthorizedError, {status: HttpStatus.UNAUTHORIZED}),
      ),
    )
  }

  useInvalidLogin(): void {
    this.server.use(
      http.post(this.url('/auth/web/login'), () =>
        HttpResponse.json(invalidCredentialsError, {status: HttpStatus.UNAUTHORIZED}),
      ),
    )
  }

  useForbiddenMembers(): void {
    this.server.use(
      http.get(this.url('/me'), () => HttpResponse.json(ownerMe)),
      http.get(this.url('/tenants/:tenantId/members'), () =>
        HttpResponse.json(forbiddenError, {status: HttpStatus.FORBIDDEN}),
      ),
      http.post(this.url('/auth/web/refresh'), () => HttpResponse.json(ownerAuthSession)),
    )
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`
  }
}
