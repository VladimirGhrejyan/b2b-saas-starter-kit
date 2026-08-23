import {describe, expect, it} from 'vitest'

import {MembershipStatus} from './membership-status'
import {TenantStatus} from './tenant-status'
import {UserStatus} from './user-status'

describe('status enums', () => {
  it('parses each UserStatus and TenantStatus literal', () => {
    for (const value of UserStatus.values) {
      expect(UserStatus.parse(value)).toBe(value)
    }

    for (const value of TenantStatus.values) {
      expect(TenantStatus.parse(value)).toBe(value)
    }
  })

  it('parses each MembershipStatus literal', () => {
    expect(MembershipStatus.values).toEqual(['invited', 'active', 'suspended'])

    for (const value of MembershipStatus.values) {
      expect(MembershipStatus.parse(value)).toBe(value)
    }
  })

  it('rejects unknown strings', () => {
    expect(() => UserStatus.parse('pending')).toThrow()
    expect(() => TenantStatus.parse('archived')).toThrow()
    expect(() => MembershipStatus.parse('deleted')).toThrow()
    expect(() => UserStatus.parse('')).toThrow()
  })
})
