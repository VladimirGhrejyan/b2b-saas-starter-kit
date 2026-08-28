import type {FetchBaseQueryError} from '@reduxjs/toolkit/query'
import {randomUUID} from 'node:crypto'

import {HttpStatus} from '@b2b-saas-starter-kit/contracts'
import {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {setSession} from '../../session/session.slice'
import {createTestStore} from '../../testing/create-test-store'

import {FrontendApi} from './frontend-api'

const probeApi = FrontendApi.instance.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    probe: build.query<unknown, undefined>({
      query: () => '/probe',
    }),
  }),
})

describe('FrontendApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sets x-user-id and x-tenant-id from session', async () => {
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

    expect(headers.get('x-user-id')).toBe(userId)
    expect(headers.get('x-tenant-id')).toBe(tenantId)
    expect(headers.get('authorization')).toBeNull()
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
