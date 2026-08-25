import {describe, expect, it} from 'vitest'

import type {Clock} from './clock.port'

describe('Clock', () => {
  it('accepts an in-memory-shaped fake', () => {
    const clock: Clock = {
      now: () => new Date('2026-01-01T00:00:00.000Z'),
    }

    expect(clock.now().toISOString()).toBe('2026-01-01T00:00:00.000Z')
  })
})
