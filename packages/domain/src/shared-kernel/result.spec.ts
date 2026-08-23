import {describe, expect, expectTypeOf, it} from 'vitest'

import {Result} from './result'
import type {Fail, Ok} from './result.types'

describe('Result', () => {
  it('creates an ok value and narrows with isOk', () => {
    const result = Result.ok(42)

    expect(Result.isOk(result)).toBe(true)
    expect(Result.isFail(result)).toBe(false)

    if (Result.isOk(result)) {
      expect(result.value).toBe(42)
      expectTypeOf(result).toEqualTypeOf<Ok<number>>()
    }
  })

  it('creates a fail value and narrows with isFail', () => {
    const result = Result.fail('missing')

    expect(Result.isFail(result)).toBe(true)
    expect(Result.isOk(result)).toBe(false)

    if (Result.isFail(result)) {
      expect(result.error).toBe('missing')
      expectTypeOf(result).toEqualTypeOf<Fail<string>>()
    }
  })
})
