import {type TenantMembersOutput, tenantMembersOutputSchema} from '@b2b-saas-starter-kit/contracts'
import type {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'
import {FrontendApi} from '@b2b-saas-starter-kit/frontend-core'

export const membersApi = FrontendApi.instance.injectEndpoints({
  endpoints: (build) => ({
    listMembers: build.query<TenantMembersOutput, TenantId>({
      query: (tenantId) => `/tenants/${tenantId}/members`,
      transformResponse: (response: unknown) => tenantMembersOutputSchema.parse(response),
      providesTags: ['Membership'],
    }),
  }),
})

export const {useListMembersQuery} = membersApi
