import {describe, expect, it} from 'vitest'

import {PermissionCatalog} from './permission-catalog'
import {SystemRoles} from './system-roles'

describe('SystemRoles', () => {
  it('gives Owner the entire catalog', () => {
    expect(SystemRoles.permissionsFor('Owner')).toEqual(PermissionCatalog.all)
  })

  it('gives Admin a strict subset of Owner that still includes members.read', () => {
    const owner = new Set(SystemRoles.permissionsFor('Owner'))
    const admin = SystemRoles.permissionsFor('Admin')

    expect(admin.length).toBeLessThan(owner.size)

    for (const permission of admin) {
      expect(owner.has(permission)).toBe(true)
    }

    expect(admin).toContain(PermissionCatalog.tenancyMembersRead)
    expect(admin).not.toContain(PermissionCatalog.authorizationRolesRead)
  })

  it('gives Member a subset of Admin without members.read', () => {
    const admin = new Set(SystemRoles.permissionsFor('Admin'))
    const member = SystemRoles.permissionsFor('Member')

    expect(member).toEqual([PermissionCatalog.tenancyTenantRead])

    for (const permission of member) {
      expect(admin.has(permission)).toBe(true)
    }

    expect(member).not.toContain(PermissionCatalog.tenancyMembersRead)
  })
})
