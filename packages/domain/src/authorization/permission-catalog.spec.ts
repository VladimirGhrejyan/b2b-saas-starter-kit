import {describe, expect, it} from 'vitest'

import {Permission} from '@b2b-saas-starter-kit/shared-kernel-types'

import {UnknownPermissionError} from './errors/unknown-permission.error'
import {PermissionCatalog} from './permission-catalog'

describe('PermissionCatalog', () => {
  it('contains four unique branded permissions', () => {
    expect(PermissionCatalog.all).toHaveLength(4)
    expect(new Set(PermissionCatalog.all).size).toBe(4)

    for (const permission of PermissionCatalog.all) {
      expect(Permission.parse(permission)).toBe(permission)
      expect(PermissionCatalog.isKnown(permission)).toBe(true)
    }
  })

  it('rejects a well-formed permission that is not in the catalog', () => {
    const unknown = Permission.parse('audit.read')

    expect(PermissionCatalog.isKnown(unknown)).toBe(false)
    expect(() => {
      PermissionCatalog.assertKnown(unknown)
    }).toThrow(UnknownPermissionError)
  })
})
