import {describe, expect, it} from 'vitest'

import {errorOutputSchema} from './error.output'

describe('errorOutputSchema', () => {
  it('parses a valid envelope', () => {
    const parsed = errorOutputSchema.parse({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: [{path: 'email'}],
    })

    expect(parsed.code).toBe('VALIDATION_ERROR')
    expect(parsed.message).toBe('Invalid input')
  })

  it('rejects a missing code', () => {
    const result = errorOutputSchema.safeParse({message: 'nope'})

    expect(result.success).toBe(false)
  })
})
