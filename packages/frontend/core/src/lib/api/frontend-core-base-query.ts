import type {BaseQueryFn, FetchArgs} from '@reduxjs/toolkit/query'
import {fetchBaseQuery} from '@reduxjs/toolkit/query'

import type {ErrorOutput} from '@b2b-saas-starter-kit/contracts'

import {FrontendCoreConfigLocator} from '../../config/frontend-core-config.locator'

import {FetchErrorMapper} from './fetch-error-mapper'
import {prepareHeaders} from './prepare-headers'

export const frontendCoreBaseQuery: BaseQueryFn<string | FetchArgs, unknown, ErrorOutput> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await fetchBaseQuery({
    baseUrl: FrontendCoreConfigLocator.get().baseUrl,
    prepareHeaders,
  })(args, api, extraOptions)

  if (result.error) {
    return {
      error: FetchErrorMapper.map(result.error),
      meta: result.meta,
    }
  }

  return result
}
