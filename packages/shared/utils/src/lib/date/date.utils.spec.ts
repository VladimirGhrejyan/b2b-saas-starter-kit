import {describe, expect, it} from 'vitest'

import {DateUtils} from './date.utils'

describe('DateUtils', () => {
  const iso = '2024-06-15T12:30:00.000Z'
  const date = new Date(iso)

  it('parse / serialize / unix', () => {
    expect(DateUtils.parseIso(iso)?.toISOString()).toBe(iso)
    expect(DateUtils.parseIso('not-a-date')).toBeUndefined()
    expect(DateUtils.toIsoString(date)).toBe(iso)
    expect(DateUtils.toUnixMs(DateUtils.fromUnixMs(date.getTime()))).toBe(date.getTime())
  })

  it('UTC day bounds and arithmetic', () => {
    expect(DateUtils.startOfUtcDay(date).toISOString()).toBe('2024-06-15T00:00:00.000Z')
    expect(DateUtils.endOfUtcDay(date).toISOString()).toBe('2024-06-15T23:59:59.999Z')
    expect(DateUtils.addUtcDays(date, 1).toISOString()).toBe('2024-06-16T12:30:00.000Z')
    expect(DateUtils.addUtcHours(date, 2).toISOString()).toBe('2024-06-15T14:30:00.000Z')
    expect(DateUtils.addUtcMinutes(date, 30).toISOString()).toBe('2024-06-15T13:00:00.000Z')
  })

  it('diff and compare', () => {
    const later = DateUtils.addUtcHours(date, 1)

    expect(DateUtils.diffUtcMs(later, date)).toBe(60 * 60 * 1000)
    expect(DateUtils.compare(date, later)).toBe(-1)
    expect(DateUtils.compare(later, date)).toBe(1)
    expect(DateUtils.compare(date, date)).toBe(0)
  })

  it('throws on invalid Date for mutating helpers', () => {
    const invalid = new Date(Number.NaN)

    expect(DateUtils.isValid(invalid)).toBe(false)
    expect(() => DateUtils.toIsoString(invalid)).toThrow(RangeError)
  })
})
