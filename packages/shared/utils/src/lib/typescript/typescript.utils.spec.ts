import {describe, expect, expectTypeOf, it} from 'vitest'

import {TypeScriptUtils} from './typescript.utils'

describe('TypeScriptUtils', () => {
  it('nil / defined / string / number guards', () => {
    expect(TypeScriptUtils.isNil(null)).toBe(true)
    expect(TypeScriptUtils.isNil(undefined)).toBe(true)
    expect(TypeScriptUtils.isNil(0)).toBe(false)
    expect(TypeScriptUtils.isDefined(0)).toBe(true)
    expect(TypeScriptUtils.isDefined(null)).toBe(false)
    expect(TypeScriptUtils.isString('a')).toBe(true)
    expect(TypeScriptUtils.isNonEmptyString('a')).toBe(true)
    expect(TypeScriptUtils.isNonEmptyString('')).toBe(false)
    expect(TypeScriptUtils.isNonEmptyString('  ')).toBe(true)
    expect(TypeScriptUtils.isNonEmptyString(undefined)).toBe(false)
    expect(TypeScriptUtils.isNumber(Number.NaN)).toBe(true)
    expect(TypeScriptUtils.isNumber('1')).toBe(false)
  })

  it('isEmpty semantics', () => {
    expect(TypeScriptUtils.isEmpty(null)).toBe(true)
    expect(TypeScriptUtils.isEmpty('')).toBe(true)
    expect(TypeScriptUtils.isEmpty('  ')).toBe(false)
    expect(TypeScriptUtils.isEmpty([])).toBe(true)
    expect(TypeScriptUtils.isEmpty({})).toBe(true)
    expect(TypeScriptUtils.isEmpty(new Map())).toBe(true)
    expect(TypeScriptUtils.isEmpty(new Set([1]))).toBe(false)
    expect(TypeScriptUtils.isEmpty(0)).toBe(false)
    expect(TypeScriptUtils.isEmpty(new Date())).toBe(false)
  })

  it('assertDefined / assertNever / fail', () => {
    expect(() => {
      TypeScriptUtils.assertDefined(null)
    }).toThrow()
    expect(() => {
      TypeScriptUtils.fail('boom')
    }).toThrow('boom')

    const value = 'a' as const

    expect(() => {
      TypeScriptUtils.assertNever(value as never)
    }).toThrow()
  })

  it('isNonEmptyString narrows types', () => {
    const value: unknown = 'ok'

    if (TypeScriptUtils.isNonEmptyString(value)) {
      expectTypeOf(value).toEqualTypeOf<string>()
    }
  })

  it('assertDefined narrows types', () => {
    const value: string | null = 'ok'

    TypeScriptUtils.assertDefined(value)
    expectTypeOf(value).toEqualTypeOf<string>()
  })
})
