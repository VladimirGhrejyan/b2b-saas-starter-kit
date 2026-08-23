import {describe, expect, it} from 'vitest'

import {Permission} from './permission'

describe('Permission', () => {
  it('accepts a namespaced permission identifier', () => {
    expect(Permission.parse('tenancy.members.read')).toBe('tenancy.members.read')
    expect(Permission.parse('authorization.roles.manage')).toBe('authorization.roles.manage')
  })

  it('rejects single-segment, empty, and uppercase identifiers', () => {
    expect(() => Permission.parse('members')).toThrow()
    expect(() => Permission.parse('')).toThrow()
    expect(() => Permission.parse('Tenancy.Members.Read')).toThrow()
    expect(() => Permission.parse('tenancy.Members.read')).toThrow()
  })
})
