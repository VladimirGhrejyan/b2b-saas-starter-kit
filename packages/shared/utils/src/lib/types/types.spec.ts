import {describe, expectTypeOf, it} from 'vitest'

import type {
  NonEmptyArray,
  Nullable,
  Nullish,
  ObjectValue,
  RequireAtLeastOne,
  RequireExactlyOne,
  WithOptional,
  WithRequired,
} from '../../index'

describe('utility types', () => {
  it('ObjectValue / WithRequired / WithOptional', () => {
    type Sample = {a: number; b?: string}

    expectTypeOf<ObjectValue<Sample>>().toEqualTypeOf<number | string | undefined>()
    expectTypeOf<WithRequired<Sample, 'b'>>().toEqualTypeOf<{a: number; b?: string} & {b: string}>()
    expectTypeOf<WithOptional<Sample, 'a'>>().toEqualTypeOf<{b?: string} & {a?: number}>()
  })

  it('RequireAtLeastOne / RequireExactlyOne / nullable helpers / NonEmptyArray', () => {
    type Patch = RequireAtLeastOne<{a?: number; b?: string}, 'a' | 'b'>
    type Xor = RequireExactlyOne<{a?: number; b?: string}, 'a' | 'b'>

    expectTypeOf<Patch>().toExtend<{a: number; b?: string} | {b: string; a?: number}>()
    expectTypeOf<Xor>().toExtend<{a: number; b?: never} | {b: string; a?: never}>()
    expectTypeOf<Nullable<string>>().toEqualTypeOf<string | null>()
    expectTypeOf<Nullish<string>>().toEqualTypeOf<string | null | undefined>()
    expectTypeOf<NonEmptyArray<number>>().toEqualTypeOf<readonly [number, ...number[]]>()
  })
})
