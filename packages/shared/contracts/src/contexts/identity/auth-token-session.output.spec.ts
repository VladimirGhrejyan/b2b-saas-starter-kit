import {describe, expect, it} from 'vitest'

import {authTokenSessionOutputSchema} from './auth-token-session.output'

describe('authTokenSessionOutputSchema', () => {
  it('requires refreshToken', () => {
    expect(
      authTokenSessionOutputSchema.safeParse({
        accessToken: 'access',
        expiresIn: 900,
        userId: '11111111-1111-4111-8111-111111111111',
      }).success,
    ).toBe(false)
  })
})
