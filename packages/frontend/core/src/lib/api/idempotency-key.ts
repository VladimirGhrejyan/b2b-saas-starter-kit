import type {FetchArgs} from '@reduxjs/toolkit/query'

import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

import type {FrontendApiExtraOptions} from './frontend-api.types'

/**
 * Sets `Idempotency-Key` once per RTK baseQuery invocation when the endpoint opts in.
 */
export class IdempotencyKey {
  static readonly header = 'idempotency-key'

  static apply(args: string | FetchArgs, extra: FrontendApiExtraOptions | undefined): string | FetchArgs {
    if (extra?.idempotent !== true) {
      return args
    }

    const request: FetchArgs = typeof args === 'string' ? {url: args} : {...args}
    const headers = IdempotencyKey.asHeaders(request.headers)

    if (!TypeScriptUtils.isNonEmptyString(headers.get(IdempotencyKey.header))) {
      headers.set(IdempotencyKey.header, crypto.randomUUID())
    }

    request.headers = headers

    return request
  }

  private static asHeaders(value: FetchArgs['headers']): Headers {
    if (value instanceof Headers) {
      return new Headers(value)
    }

    const headers = new Headers()

    if (Array.isArray(value)) {
      for (const entry of value) {
        const name = entry[0]
        const headerValue = entry[1]

        if (TypeScriptUtils.isNonEmptyString(name) && TypeScriptUtils.isNonEmptyString(headerValue)) {
          headers.append(name, headerValue)
        }
      }

      return headers
    }

    if (value === undefined) {
      return headers
    }

    for (const [name, headerValue] of Object.entries(value)) {
      if (TypeScriptUtils.isNonEmptyString(headerValue)) {
        headers.set(name, headerValue)
      }
    }

    return headers
  }
}
