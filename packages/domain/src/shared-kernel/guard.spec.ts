import {describe, expect, it} from 'vitest'

import {DomainError} from './domain-error'
import {Guard} from './guard'

const emptyError = new DomainError('EMPTY', 'value must not be empty')
const nilError = new DomainError('NIL', 'value must be defined')

describe('Guard', () => {
  it('accepts a non-empty string and a defined value', () => {
    expect(() => {
      Guard.againstEmpty('name', emptyError)
    }).not.toThrow()
    expect(() => {
      Guard.againstNil(0, nilError)
    }).not.toThrow()
  })

  it('throws the provided DomainError for empty or nil values', () => {
    expect(() => {
      Guard.againstEmpty('', emptyError)
    }).toThrow(emptyError)
    expect(() => {
      Guard.againstEmpty('   ', emptyError)
    }).toThrow(emptyError)
    expect(() => {
      Guard.againstNil(null, nilError)
    }).toThrow(nilError)
    expect(() => {
      Guard.againstNil(undefined, nilError)
    }).toThrow(nilError)
  })
})
