import {describe, expect, it} from 'vitest'

import {refreshTokenInputSchema} from './refresh-token.input'

describe('refreshTokenInputSchema', () => {
  it('parses a non-empty refresh token', () => {
    expect(refreshTokenInputSchema.parse({refreshToken: 'opaque-token'})).toEqual({refreshToken: 'opaque-token'})
  })

  it('rejects an empty refresh token', () => {
    expect(refreshTokenInputSchema.safeParse({refreshToken: ''}).success).toBe(false)
  })
})
