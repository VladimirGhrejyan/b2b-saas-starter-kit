import {describe, expect, it} from 'vitest'

import {loginInputSchema} from './login.input'

describe('loginInputSchema', () => {
  it('parses a valid payload', () => {
    expect(loginInputSchema.parse({email: 'ada@example.com', password: 'secret-password'})).toEqual({
      email: 'ada@example.com',
      password: 'secret-password',
    })
  })

  it('rejects an empty password', () => {
    expect(loginInputSchema.safeParse({email: 'ada@example.com', password: ''}).success).toBe(false)
  })
})
