import {randomUUID} from 'node:crypto'

import {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {setSession} from '../../session/session.slice'
import {createTestStore} from '../../testing/create-test-store'

import {api} from './api'

const probeApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (build) => ({
    probe: build.query<unknown, undefined>({
      query: () => '/probe',
    }),
  }),
})

describe('prepareHeaders', () => {
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
})
