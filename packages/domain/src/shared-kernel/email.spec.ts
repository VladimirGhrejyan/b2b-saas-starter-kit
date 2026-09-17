import {describe, expect, it} from 'vitest'

import {DomainError} from './domain-error'
import {normalizeEmail} from './email'

class TestInvalidEmailError extends DomainError {
  constructor() {
    super('TEST_INVALID_EMAIL', 'invalid email')
  }
}

describe('normalizeEmail', () => {
  it('trims and lowercases a valid email', () => {
    expect(normalizeEmail('  Ada@Example.COM ', () => new TestInvalidEmailError())).toBe('ada@example.com')
  })

  it('rejects blank and malformed values', () => {
    expect(() => normalizeEmail('', () => new TestInvalidEmailError())).toThrow(TestInvalidEmailError)
    expect(() => normalizeEmail('not-an-email', () => new TestInvalidEmailError())).toThrow(TestInvalidEmailError)
  })
})
