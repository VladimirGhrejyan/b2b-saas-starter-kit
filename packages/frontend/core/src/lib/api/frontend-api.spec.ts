import type {FetchBaseQueryError} from '@reduxjs/toolkit/query'
import {randomUUID} from 'node:crypto'

import {HttpStatus} from '@b2b-saas-starter-kit/contracts'
import {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {SessionSelectors} from '../../session/session.selectors'
import {setSession} from '../../session/session.slice'
import {createTestStore} from '../../testing/create-test-store'
import {resetWebAccessTokenRefresh} from '../../testing/reset-web-access-token-refresh'

import {FrontendApi} from './frontend-api'

const probeApi = FrontendApi.instance.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    probe: build.query<unknown, undefined>({
      query: () => '/probe',
    }),
    probeOther: build.query<unknown, undefined>({
      query: () => '/probe-other',
    }),
    login: build.mutation<unknown, undefined>({
      query: () => ({url: '/auth/web/login', method: 'POST'}),
    }),
    createTenant: build.mutation<unknown, undefined>({
      query: () => ({url: '/tenants', method: 'POST', body: {name: 'Acme'}}),
      extraOptions: {idempotent: true},
    }),
    createTenantWithKey: build.mutation<unknown, string>({
      query: (key) => ({
        url: '/tenants',
        method: 'POST',
        body: {name: 'Acme'},
        headers: {'idempotency-key': key},
      }),
      extraOptions: {idempotent: true},
    }),
  }),
})

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input
  }

  if (input instanceof URL) {
    return input.href
  }

  return input.url
}

function requestInit(input: RequestInfo | URL, init: RequestInit | undefined): RequestInit | undefined {
  if (input instanceof Request) {
    return input
  }

  return init
}

function requestHeaders(call: readonly unknown[] | undefined): Headers {
  const [input, init] = (call ?? []) as [RequestInfo | URL | undefined, RequestInit | undefined]

  if (input instanceof Request) {
    return input.headers
  }

  return new Headers(init?.headers)
}

describe('FrontendApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    resetWebAccessTokenRefresh()
  })

  it('sets Authorization Bearer from the session and includes credentials', async () => {
    const userId = UserId.parse(randomUUID())
    const tenantId = TenantId.parse(randomUUID())
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ok: true}), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      }),
    )

    vi.stubGlobal('fetch', fetchMock)

    const store = createTestStore()

    store.dispatch(
      setSession({
        accessToken: 'access-token',
        userId,
        activeTenantId: tenantId,
        effectivePermissions: [],
      }),
    )

    store.dispatch(probeApi.endpoints.probe.initiate(undefined))

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    const [input, init] = fetchMock.mock.calls[0] as [RequestInfo, RequestInit | undefined]
    const headers = input instanceof Request ? input.headers : new Headers(init?.headers)
    const request = requestInit(input, init)

    expect(headers.get('authorization')).toBe('Bearer access-token')
    expect(headers.get('x-user-id')).toBeNull()
    expect(headers.get('x-tenant-id')).toBeNull()
    expect(request?.credentials).toBe('include')
  })

  it('refreshes once for concurrent 401s and retries the original requests', async () => {
    const userId = UserId.parse(randomUUID())
    const tenantId = TenantId.parse(randomUUID())
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = requestUrl(input)
      const headers = input instanceof Request ? input.headers : new Headers(init?.headers)

      if (url.includes('auth/web/refresh')) {
        return new Response(
          JSON.stringify({
            accessToken: 'rotated-token',
            expiresIn: 900,
            userId,
            tenantId,
          }),
          {status: 200, headers: {'Content-Type': 'application/json'}},
        )
      }

      if (headers.get('authorization') === 'Bearer rotated-token') {
        return new Response(JSON.stringify({ok: true}), {
          status: 200,
          headers: {'Content-Type': 'application/json'},
        })
      }

      return new Response(JSON.stringify({code: 'UNAUTHORIZED', message: 'expired'}), {
        status: HttpStatus.UNAUTHORIZED,
        headers: {'Content-Type': 'application/json'},
      })
    })

    vi.stubGlobal('fetch', fetchMock)

    const store = createTestStore()

    store.dispatch(
      setSession({
        accessToken: 'expired-token',
        userId,
        activeTenantId: tenantId,
        effectivePermissions: [],
      }),
    )

    await Promise.all([
      store.dispatch(probeApi.endpoints.probe.initiate(undefined)),
      store.dispatch(probeApi.endpoints.probeOther.initiate(undefined)),
    ])

    const refreshCalls = fetchMock.mock.calls.filter(([input]) => requestUrl(input).includes('auth/web/refresh'))

    expect(refreshCalls).toHaveLength(1)
    expect(SessionSelectors.accessToken(store.getState())).toBe('rotated-token')
  })

  it('clears the session when refresh fails', async () => {
    const userId = UserId.parse(randomUUID())
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (requestUrl(input).includes('auth/web/refresh')) {
        return new Response(JSON.stringify({code: 'UNAUTHORIZED', message: 'no cookie'}), {
          status: HttpStatus.UNAUTHORIZED,
          headers: {'Content-Type': 'application/json'},
        })
      }

      return new Response(JSON.stringify({code: 'UNAUTHORIZED', message: 'expired'}), {
        status: HttpStatus.UNAUTHORIZED,
        headers: {'Content-Type': 'application/json'},
      })
    })

    vi.stubGlobal('fetch', fetchMock)

    const store = createTestStore()

    store.dispatch(
      setSession({
        accessToken: 'expired-token',
        userId,
        activeTenantId: null,
        effectivePermissions: [],
      }),
    )

    await store.dispatch(probeApi.endpoints.probe.initiate(undefined))

    expect(SessionSelectors.accessToken(store.getState())).toBeNull()
    expect(SessionSelectors.userId(store.getState())).toBeNull()
  })

  it('does not refresh on 401 from auth/web/login', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({code: 'INVALID_CREDENTIALS', message: 'bad password'}), {
        status: HttpStatus.UNAUTHORIZED,
        headers: {'Content-Type': 'application/json'},
      }),
    )

    vi.stubGlobal('fetch', fetchMock)

    const store = createTestStore()

    await store.dispatch(probeApi.endpoints.login.initiate(undefined))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(requestUrl(fetchMock.mock.calls[0]?.[0] as RequestInfo | URL)).toContain('auth/web/login')
    expect(requestHeaders(fetchMock.mock.calls[0]).get('idempotency-key')).toBeNull()
  })

  it('sends a UUID Idempotency-Key on opted-in mutations', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ok: true}), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      }),
    )

    vi.stubGlobal('fetch', fetchMock)

    const store = createTestStore()

    await store.dispatch(probeApi.endpoints.createTenant.initiate(undefined))

    expect(requestHeaders(fetchMock.mock.calls[0]).get('idempotency-key')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    )
  })

  it('reuses the same Idempotency-Key after a 401 refresh retry', async () => {
    const userId = UserId.parse(randomUUID())
    const tenantId = TenantId.parse(randomUUID())
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = requestUrl(input)
      const headers = requestHeaders([input, init])

      if (url.includes('auth/web/refresh')) {
        return new Response(
          JSON.stringify({
            accessToken: 'rotated-token',
            expiresIn: 900,
            userId,
            tenantId,
          }),
          {status: 200, headers: {'Content-Type': 'application/json'}},
        )
      }

      if (headers.get('authorization') === 'Bearer rotated-token') {
        return new Response(JSON.stringify({ok: true}), {
          status: 200,
          headers: {'Content-Type': 'application/json'},
        })
      }

      return new Response(JSON.stringify({code: 'UNAUTHORIZED', message: 'expired'}), {
        status: HttpStatus.UNAUTHORIZED,
        headers: {'Content-Type': 'application/json'},
      })
    })

    vi.stubGlobal('fetch', fetchMock)

    const store = createTestStore()

    store.dispatch(
      setSession({
        accessToken: 'expired-token',
        userId,
        activeTenantId: tenantId,
        effectivePermissions: [],
      }),
    )

    await store.dispatch(probeApi.endpoints.createTenant.initiate(undefined))

    const productCalls = fetchMock.mock.calls.filter(([input]) => requestUrl(input).includes('/tenants'))

    expect(productCalls).toHaveLength(2)
    expect(requestHeaders(productCalls[0]).get('idempotency-key')).toBe(
      requestHeaders(productCalls[1]).get('idempotency-key'),
    )
    expect(requestHeaders(productCalls[0]).get('idempotency-key')).toBeTruthy()
  })

  it('preserves an explicit Idempotency-Key on opted-in mutations', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ok: true}), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      }),
    )

    vi.stubGlobal('fetch', fetchMock)

    const store = createTestStore()

    await store.dispatch(probeApi.endpoints.createTenantWithKey.initiate('stable-key'))

    expect(requestHeaders(fetchMock.mock.calls[0]).get('idempotency-key')).toBe('stable-key')
  })

  it('returns the contracts envelope when the body matches', () => {
    const error: FetchBaseQueryError = {
      status: HttpStatus.FORBIDDEN,
      data: {
        code: 'INSUFFICIENT_PERMISSION',
        message: "missing permission 'tenancy.members.read'",
        details: {permission: 'tenancy.members.read'},
      },
    }

    expect(FrontendApi.mapError(error)).toEqual({
      code: 'INSUFFICIENT_PERMISSION',
      message: "missing permission 'tenancy.members.read'",
      details: {permission: 'tenancy.members.read'},
    })
  })

  it('falls back to a wire HTTP code when the body is not the contracts shape', () => {
    const error: FetchBaseQueryError = {
      status: HttpStatus.UNAUTHORIZED,
      data: {not: 'an envelope'},
    }

    expect(FrontendApi.mapError(error)).toEqual({
      code: 'UNAUTHORIZED',
      message: 'Request failed',
    })
  })

  it('falls back to VALIDATION_ERROR only when the envelope carries that code', () => {
    const error: FetchBaseQueryError = {
      status: HttpStatus.BAD_REQUEST,
      data: {code: 'VALIDATION_ERROR', message: 'Invalid input'},
    }

    expect(FrontendApi.mapError(error)).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
    })
  })
})
