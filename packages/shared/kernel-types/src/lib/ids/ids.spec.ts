import {describe, expect, expectTypeOf, it} from 'vitest'

import {MembershipId} from './membership-id'
import {RoleId} from './role-id'
import {TenantId} from './tenant-id'
import {UserId} from './user-id'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

describe('branded IDs', () => {
  it('round-trips a UUID through each ID parse helper', () => {
    expect(UserId.parse(VALID_UUID)).toBe(VALID_UUID)
    expect(TenantId.parse(VALID_UUID)).toBe(VALID_UUID)
    expect(MembershipId.parse(VALID_UUID)).toBe(VALID_UUID)
    expect(RoleId.parse(VALID_UUID)).toBe(VALID_UUID)
  })

  it('rejects invalid values', () => {
    expect(() => UserId.parse('not-a-uuid')).toThrow()
    expect(() => TenantId.parse('')).toThrow()
    expect(() => MembershipId.parse(null)).toThrow()
    expect(() => RoleId.parse(1)).toThrow()
  })

  it('does not treat different ID brands as the same type', () => {
    expectTypeOf<UserId>().not.toEqualTypeOf<TenantId>()
    expectTypeOf<UserId>().not.toEqualTypeOf<MembershipId>()
    expectTypeOf<UserId>().not.toEqualTypeOf<RoleId>()
    expectTypeOf<TenantId>().not.toEqualTypeOf<RoleId>()
  })
})
