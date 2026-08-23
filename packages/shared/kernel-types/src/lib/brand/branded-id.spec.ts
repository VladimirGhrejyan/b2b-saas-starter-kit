import {describe, expect, expectTypeOf, it} from 'vitest'
import {z} from 'zod'

import {BrandedId} from './branded-id'

const SampleId = BrandedId.create('SampleId', z.uuid())

type SampleId = z.infer<typeof SampleId.schema>

const OtherId = BrandedId.create('OtherId', z.uuid())

type OtherId = z.infer<typeof OtherId.schema>

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

describe('BrandedId', () => {
  it('parses a valid UUID into a branded value', () => {
    const parsed = SampleId.parse(VALID_UUID)

    expect(parsed).toBe(VALID_UUID)
    expectTypeOf(parsed).toEqualTypeOf<SampleId>()
  })

  it('rejects a non-UUID string and a non-string', () => {
    expect(() => SampleId.parse('not-a-uuid')).toThrow()
    expect(() => SampleId.parse(42)).toThrow()
  })

  it('keeps distinct brands unassignable', () => {
    expectTypeOf<SampleId>().not.toEqualTypeOf<OtherId>()
  })
})
