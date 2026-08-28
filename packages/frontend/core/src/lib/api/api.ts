import {createApi} from '@reduxjs/toolkit/query/react'

import {frontendCoreBaseQuery} from './frontend-core-base-query'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: frontendCoreBaseQuery,
  tagTypes: ['Me', 'Tenant', 'Membership'],
  endpoints: () => ({}),
})
