import type {FetchBaseQueryError} from '@reduxjs/toolkit/query'

import {HttpStatus} from '@b2b-saas-starter-kit/contracts'

import {FetchErrorMapper} from './fetch-error-mapper'

describe('FetchErrorMapper', () => {
  it('returns the contracts envelope when the body matches', () => {
    const error: FetchBaseQueryError = {
      status: HttpStatus.FORBIDDEN,
      data: {
        code: 'INSUFFICIENT_PERMISSION',
        message: "missing permission 'tenancy.members.read'",
        details: {permission: 'tenancy.members.read'},
      },
    }

    expect(FetchErrorMapper.map(error)).toEqual({
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

    expect(FetchErrorMapper.map(error)).toEqual({
      code: 'UNAUTHORIZED',
      message: 'Request failed',
    })
  })

  it('falls back to VALIDATION_ERROR only when the envelope carries that code', () => {
    const error: FetchBaseQueryError = {
      status: HttpStatus.BAD_REQUEST,
      data: {code: 'VALIDATION_ERROR', message: 'Invalid input'},
    }

    expect(FetchErrorMapper.map(error)).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
    })
  })
})
