import {describe, expect, expectTypeOf, it} from 'vitest'

import {ArrayUtils} from './array.utils'

describe('ArrayUtils', () => {
  it('isNonEmpty / first / last', () => {
    expect(ArrayUtils.isNonEmpty([])).toBe(false)
    expect(ArrayUtils.isNonEmpty([1])).toBe(true)

    const empty: number[] = []
    const emptyFirst = ArrayUtils.first(empty)
    const emptyLast = ArrayUtils.last(empty)

    expect(emptyFirst).toBe(undefined)
    expect(emptyLast).toBe(undefined)

    const nonEmpty = [1, 2, 3] as const

    if (ArrayUtils.isNonEmpty(nonEmpty)) {
      expect(ArrayUtils.first(nonEmpty)).toBe(1)
      expect(ArrayUtils.last(nonEmpty)).toBe(3)
      expectTypeOf(ArrayUtils.first(nonEmpty)).toEqualTypeOf<1 | 2 | 3>()
    }
  })

  it('unique and uniqueBy', () => {
    expect(ArrayUtils.unique([1, 1, 2, 3, 2])).toEqual([1, 2, 3])
    expect(ArrayUtils.uniqueBy([{id: 1}, {id: 1}, {id: 2}], (item) => item.id)).toEqual([{id: 1}, {id: 2}])
  })

  it('groupBy', () => {
    expect(ArrayUtils.groupBy(['a', 'bb', 'c', 'dd'], (item) => item.length)).toEqual({
      1: ['a', 'c'],
      2: ['bb', 'dd'],
    })
  })

  it('partition with type predicate', () => {
    const [numbers, rest] = ArrayUtils.partition([1, 'a', 2, 'b'], (item): item is number => typeof item === 'number')

    expect(numbers).toEqual([1, 2])
    expect(rest).toEqual(['a', 'b'])
    expectTypeOf(numbers).toEqualTypeOf<number[]>()
    expectTypeOf(rest).toEqualTypeOf<string[]>()
  })

  it('chunk / compact / filterMap', () => {
    expect(ArrayUtils.chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
    expect(() => ArrayUtils.chunk([1], 0)).toThrow(RangeError)
    expect(ArrayUtils.compact([1, null, 2, undefined])).toEqual([1, 2])
    expect(ArrayUtils.filterMap([1, 2, 3], (n) => (n % 2 === 0 ? n * 10 : undefined))).toEqual([20])
  })
})
