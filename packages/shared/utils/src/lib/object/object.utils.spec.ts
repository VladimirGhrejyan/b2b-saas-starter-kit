import {describe, expect, expectTypeOf, it} from 'vitest'

import {ObjectUtils} from './object.utils'

describe('ObjectUtils', () => {
  it('keys/values/entries preserve key typing (pragmatic)', () => {
    const obj = {a: 1, b: 'two'} as const

    expect(ObjectUtils.keys(obj)).toEqual(['a', 'b'])
    expect(ObjectUtils.values(obj)).toEqual([1, 'two'])
    expect(ObjectUtils.entries(obj)).toEqual([
      ['a', 1],
      ['b', 'two'],
    ])

    expectTypeOf(ObjectUtils.keys(obj)).toEqualTypeOf<Array<'a' | 'b'>>()
    expectTypeOf(ObjectUtils.values(obj)).toEqualTypeOf<Array<1 | 'two'>>()
  })

  it('hasOwn narrows ownership', () => {
    const obj: Record<string, number> = {x: 1}

    expect(ObjectUtils.hasOwn(obj, 'x')).toBe(true)
    expect(ObjectUtils.hasOwn(obj, 'y')).toBe(false)
  })

  it('isPlainObject detects plain objects only', () => {
    expect(ObjectUtils.isPlainObject({})).toBe(true)
    expect(ObjectUtils.isPlainObject(Object.create(null))).toBe(true)
    expect(ObjectUtils.isPlainObject([])).toBe(false)
    expect(ObjectUtils.isPlainObject(null)).toBe(false)
    expect(ObjectUtils.isPlainObject(new Date())).toBe(false)
  })

  it('pick and omit preserve subsets', () => {
    const obj = {a: 1, b: 2, c: 3}

    expect(ObjectUtils.pick(obj, ['a', 'c'])).toEqual({a: 1, c: 3})
    expect(ObjectUtils.omit(obj, ['b'])).toEqual({a: 1, c: 3})
    expectTypeOf(ObjectUtils.pick(obj, ['a'] as const)).toEqualTypeOf<{a: number}>()
  })

  it('fromEntries builds a typed record', () => {
    expect(ObjectUtils.fromEntries([['a', 1] as const, ['b', 2] as const])).toEqual({a: 1, b: 2})
  })

  it('merge is shallow and immutable', () => {
    const target = {a: 1, nested: {x: 1}}
    const source = {b: 2, nested: {y: 2}}
    const merged = ObjectUtils.merge(target, source)

    expect(merged).toEqual({a: 1, b: 2, nested: {y: 2}})
    expect(merged).not.toBe(target)
    expect(target).toEqual({a: 1, nested: {x: 1}})
    expectTypeOf(merged).toEqualTypeOf<{a: number; nested: {x: number}} & {b: number; nested: {y: number}}>()
  })
})
