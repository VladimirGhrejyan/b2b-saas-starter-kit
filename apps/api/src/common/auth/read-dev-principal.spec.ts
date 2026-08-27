import {UnauthorizedException} from '@nestjs/common'
import {describe, expect, it} from 'vitest'

import {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {DEV_PRINCIPAL_KEY} from './dev-principal-key'
import {readDevPrincipal} from './read-dev-principal'

describe('readDevPrincipal', () => {
  it('returns the established principal', () => {
    const userId = UserId.parse('00000000-0000-4000-8000-000000000001')

    expect(readDevPrincipal({[DEV_PRINCIPAL_KEY]: {userId}})).toEqual({userId})
  })

  it('throws UnauthorizedException when the principal is missing', () => {
    expect(() => {
      readDevPrincipal({})
    }).toThrow(UnauthorizedException)
  })
})
