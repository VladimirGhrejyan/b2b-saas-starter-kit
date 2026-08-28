import type {BaseQueryFn, FetchArgs, FetchBaseQueryError} from '@reduxjs/toolkit/query'
import {fetchBaseQuery} from '@reduxjs/toolkit/query'
import {createApi} from '@reduxjs/toolkit/query/react'

import {type ErrorOutput, errorOutputSchema, HttpStatus} from '@b2b-saas-starter-kit/contracts'
import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

import {FrontendCoreConfigLocator} from '../../config/frontend-core-config.locator'
import {SessionSelectors} from '../../session/session.selectors'
import type {SessionState} from '../../session/session.state'

export class FrontendApi {
  static readonly baseQuery: BaseQueryFn<string | FetchArgs, unknown, ErrorOutput> = async (
    args,
    api,
    extraOptions,
  ) => {
    const result = await fetchBaseQuery({
      baseUrl: FrontendCoreConfigLocator.get().baseUrl,
      prepareHeaders: FrontendApi.prepareHeaders,
    })(args, api, extraOptions)

    if (result.error) {
      return {
        error: FrontendApi.mapError(result.error),
        meta: result.meta,
      }
    }

    return result
  }

  static readonly instance = createApi({
    reducerPath: 'api',
    baseQuery: FrontendApi.baseQuery,
    tagTypes: ['Me', 'Tenant', 'Membership'],
    endpoints: () => ({}),
  })

  static prepareHeaders(headers: Headers, api: {getState: () => unknown}): Headers {
    const state = api.getState() as {session: SessionState}
    const userId = SessionSelectors.userId(state)
    const tenantId = SessionSelectors.activeTenantId(state)

    if (!TypeScriptUtils.isNil(userId)) {
      headers.set('x-user-id', userId)
    }

    if (!TypeScriptUtils.isNil(tenantId)) {
      headers.set('x-tenant-id', tenantId)
    }

    return headers
  }

  static mapError(error: FetchBaseQueryError): ErrorOutput {
    const parsed = errorOutputSchema.safeParse(FrontendApi.errorData(error))

    if (parsed.success) {
      return parsed.data
    }

    return {
      code: FrontendApi.errorCode(error.status),
      message: FrontendApi.errorMessage(error),
    }
  }

  private static errorData(error: FetchBaseQueryError): unknown {
    if ('data' in error) {
      return error.data
    }

    return undefined
  }

  private static errorCode(status: FetchBaseQueryError['status']): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST: {
        return 'BAD_REQUEST'
      }

      case HttpStatus.UNAUTHORIZED: {
        return 'UNAUTHORIZED'
      }

      case HttpStatus.FORBIDDEN: {
        return 'FORBIDDEN'
      }

      case HttpStatus.NOT_FOUND: {
        return 'NOT_FOUND'
      }

      case HttpStatus.CONFLICT: {
        return 'CONFLICT'
      }

      case HttpStatus.INTERNAL_SERVER_ERROR: {
        return 'INTERNAL_ERROR'
      }

      default: {
        return 'HTTP_ERROR'
      }
    }
  }

  private static errorMessage(error: FetchBaseQueryError): string {
    if ('data' in error && TypeScriptUtils.isNonEmptyString(error.data)) {
      return error.data
    }

    if ('error' in error && TypeScriptUtils.isNonEmptyString(error.error)) {
      return error.error
    }

    return 'Request failed'
  }
}
