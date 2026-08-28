import type {FetchBaseQueryError} from '@reduxjs/toolkit/query'

import {type ErrorOutput, errorOutputSchema, HttpStatus} from '@b2b-saas-starter-kit/contracts'
import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

export class FetchErrorMapper {
  static map(error: FetchBaseQueryError): ErrorOutput {
    const parsed = errorOutputSchema.safeParse(FetchErrorMapper.#data(error))

    if (parsed.success) {
      return parsed.data
    }

    return {
      code: FetchErrorMapper.#code(error.status),
      message: FetchErrorMapper.#message(error),
    }
  }

  static #data(error: FetchBaseQueryError): unknown {
    if ('data' in error) {
      return error.data
    }

    return undefined
  }

  static #code(status: FetchBaseQueryError['status']): string {
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

  static #message(error: FetchBaseQueryError): string {
    if ('data' in error && TypeScriptUtils.isNonEmptyString(error.data)) {
      return error.data
    }

    if ('error' in error && TypeScriptUtils.isNonEmptyString(error.error)) {
      return error.error
    }

    return 'Request failed'
  }
}
