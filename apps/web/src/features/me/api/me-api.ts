import {type MeOutput, meOutputSchema} from '@b2b-saas-starter-kit/contracts'
import type {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'
import {type AppDispatch, FrontendApi} from '@b2b-saas-starter-kit/frontend-core'

import {hydrateMeSession} from './hydrate-me-session'

export const meApi = FrontendApi.instance.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<MeOutput, {userId: UserId; tenantId: TenantId}>({
      query: () => '/me',
      transformResponse: (response: unknown) => meOutputSchema.parse(response),
      providesTags: ['Me'],
      async onQueryStarted(arg, api) {
        try {
          const {data} = await api.queryFulfilled

          hydrateMeSession(api.dispatch as AppDispatch, arg.tenantId, data)
        } catch {
          return
        }
      },
    }),
  }),
})

export const {useGetMeQuery} = meApi
