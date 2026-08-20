import {describe, expect, it} from 'vitest'

import {NumberUtils} from './number.utils'

describe('NumberUtils', () => {
  it('guards and range helpers', () => {
    expect(NumberUtils.isFiniteNumber(1)).toBe(true)
    expect(NumberUtils.isFiniteNumber(Number.NaN)).toBe(false)
    expect(NumberUtils.isInteger(2)).toBe(true)
    expect(NumberUtils.isInteger(2.5)).toBe(false)
    expect(NumberUtils.isInRange(5, 1, 10)).toBe(true)
    expect(NumberUtils.clamp(15, 0, 10)).toBe(10)
    expect(() => NumberUtils.clamp(1, 5, 2)).toThrow(RangeError)
  })

  it('parseFinite', () => {
    expect(NumberUtils.parseFinite(' 3.5 ')).toBe(3.5)
    expect(NumberUtils.parseFinite(Number.NaN)).toBeUndefined()
    expect(NumberUtils.parseFinite('')).toBeUndefined()
    expect(NumberUtils.parseFinite('abc')).toBeUndefined()
  })
})
