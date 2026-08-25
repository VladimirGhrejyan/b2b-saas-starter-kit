import {describe, expect, it} from 'vitest'

import type {IdGenerator} from './id-generator.port'

describe('IdGenerator', () => {
  it('accepts an in-memory-shaped fake', () => {
    const ids: IdGenerator = {
      generate: () => '33333333-3333-4333-8333-333333333333',
    }

    expect(ids.generate()).toBe('33333333-3333-4333-8333-333333333333')
  })
})
