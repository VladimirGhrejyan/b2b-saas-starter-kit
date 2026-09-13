import {type AuthSessionOutput, authSessionOutputSchema, type LoginInput} from '@b2b-saas-starter-kit/contracts'
import {type AppDispatch, FrontendApi} from '@b2b-saas-starter-kit/frontend-core'

import {applyAuthSession} from './apply-auth-session'

export const authApi = FrontendApi.instance.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<AuthSessionOutput, LoginInput>({
      query: (body) => ({
        url: '/auth/web/login',
        method: 'POST',
        body,
      }),
      transformResponse: (response: unknown) => authSessionOutputSchema.parse(response),
      async onQueryStarted(_arg, api) {
        try {
          const {data} = await api.queryFulfilled

          applyAuthSession(api.dispatch as AppDispatch, data)
        } catch {
          return
        }
      },
    }),
  }),
})

export const {useLoginMutation} = authApi
