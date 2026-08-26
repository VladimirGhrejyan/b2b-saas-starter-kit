import {describe, expect, it} from 'vitest'

import {createUserInputSchema} from './create-user.input'

describe('createUserInputSchema', () => {
  it('parses a valid payload', () => {
    const parsed = createUserInputSchema.parse({
      email: 'ada@example.com',
      displayName: 'Ada',
    })

    expect(parsed.email).toBe('ada@example.com')
    expect(parsed.displayName).toBe('Ada')
  })

  it('rejects an invalid email', () => {
    expect(
      createUserInputSchema.safeParse({
        email: 'not-an-email',
        displayName: 'Ada',
      }).success,
    ).toBe(false)
  })
})
