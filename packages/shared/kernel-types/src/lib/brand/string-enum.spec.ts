import {describe, expect, expectTypeOf, it} from 'vitest'
import type {z} from 'zod'

import {StringEnum} from './string-enum'

const Color = StringEnum.create(['red', 'blue'])

type Color = z.infer<typeof Color.schema>

describe('StringEnum', () => {
  it('parses listed values and exposes the value tuple', () => {
    expect(Color.values).toEqual(['red', 'blue'])
    expect(Color.parse('red')).toBe('red')
    expectTypeOf(Color.parse('blue')).toEqualTypeOf<Color>()
  })

  it('rejects values outside the enum', () => {
    expect(() => Color.parse('green')).toThrow()
  })
})
