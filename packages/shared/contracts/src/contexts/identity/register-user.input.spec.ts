import {describe, expect, it} from 'vitest'

import {registerUserInputSchema} from './register-user.input'

describe('registerUserInputSchema', () => {
  it('parses a valid payload', () => {
    const parsed = registerUserInputSchema.parse({
      email: 'ada@example.com',
      displayName: 'Ada',
      password: 'secret-password',
    })

    expect(parsed.email).toBe('ada@example.com')
  })

  it('rejects a short password', () => {
    expect(
      registerUserInputSchema.safeParse({
        email: 'ada@example.com',
        displayName: 'Ada',
        password: 'short',
      }).success,
    ).toBe(false)
  })
})
