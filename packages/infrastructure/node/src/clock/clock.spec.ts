import {describe, expect, it} from 'vitest'

import {SystemClock} from './clock'

describe('SystemClock', () => {
  it('returns a Date close to the current UTC instant', () => {
    const clock = new SystemClock()
    const before = Date.now()
    const now = clock.now()
    const after = Date.now()

    expect(now).toBeInstanceOf(Date)
    expect(now.getTime()).toBeGreaterThanOrEqual(before)
    expect(now.getTime()).toBeLessThanOrEqual(after)
  })
})
