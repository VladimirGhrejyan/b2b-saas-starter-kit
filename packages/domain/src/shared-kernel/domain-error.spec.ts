import {describe, expect, it} from 'vitest'

import {DomainError} from './domain-error'

describe('DomainError', () => {
  it('is an Error with a stable code', () => {
    const error = new DomainError('TENANT_INVALID_NAME', 'name must not be blank')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(DomainError)
    expect(error.code).toBe('TENANT_INVALID_NAME')
    expect(error.message).toBe('name must not be blank')
    expect(error.name).toBe('DomainError')
  })
})
