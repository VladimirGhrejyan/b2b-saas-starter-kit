import {describe, expect, it} from 'vitest'

import {Permission, RoleId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {EmptyRolePermissionsError} from './errors/empty-role-permissions.error'
import {InvalidRoleNameError} from './errors/invalid-role-name.error'
import {UnknownPermissionError} from './errors/unknown-permission.error'
import {PermissionCatalog} from './permission-catalog'
import {Role} from './role'
import {SystemRoles} from './system-roles'

const ROLE_ID = RoleId.parse('11111111-1111-4111-8111-111111111111')
const OTHER_ROLE_ID = RoleId.parse('22222222-2222-4222-8222-222222222222')
const TENANT_ID = TenantId.parse('33333333-3333-4333-8333-333333333333')
const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')

describe('Role', () => {
  it('createSystemRole sets isSystem and definition permissions and records RoleCreated', () => {
    const role = Role.createSystemRole(ROLE_ID, TENANT_ID, 'Owner', OCCURRED_AT)

    expect(role.isSystem).toBe(true)
    expect(role.name).toBe('Owner')
    expect(role.tenantId).toBe(TENANT_ID)
    expect(role.permissions).toEqual(SystemRoles.permissionsFor('Owner'))
    expect(role.hasPermission(PermissionCatalog.tenancyMembersRead)).toBe(true)
    expect(role.pullEvents()).toEqual([
      {
        type: 'RoleCreated',
        occurredAt: OCCURRED_AT,
        roleId: ROLE_ID,
        tenantId: TENANT_ID,
        name: 'Owner',
        isSystem: true,
      },
    ])
    expect(role.pullEvents()).toEqual([])
  })

  it('create is not a system role and records RoleCreated', () => {
    const role = Role.create(
      ROLE_ID,
      TENANT_ID,
      'Reviewer',
      [PermissionCatalog.tenancyTenantRead, PermissionCatalog.tenancyTenantRead],
      OCCURRED_AT,
    )

    expect(role.isSystem).toBe(false)
    expect(role.name).toBe('Reviewer')
    expect(role.permissions).toEqual([PermissionCatalog.tenancyTenantRead])
    expect(role.hasPermission(PermissionCatalog.tenancyMembersRead)).toBe(false)
    expect(role.pullEvents()[0]).toMatchObject({type: 'RoleCreated', isSystem: false, name: 'Reviewer'})
  })

  it('rejects a blank name, an unknown permission, and an empty permission list', () => {
    expect(() => {
      Role.create(ROLE_ID, TENANT_ID, '   ', [PermissionCatalog.tenancyTenantRead], OCCURRED_AT)
    }).toThrow(InvalidRoleNameError)
    expect(() => {
      Role.create(ROLE_ID, TENANT_ID, 'Reviewer', [Permission.parse('audit.read')], OCCURRED_AT)
    }).toThrow(UnknownPermissionError)
    expect(() => {
      Role.create(ROLE_ID, TENANT_ID, 'Reviewer', [], OCCURRED_AT)
    }).toThrow(EmptyRolePermissionsError)
  })

  it('reconstitute does not record events and keeps catalog order', () => {
    const role = Role.reconstitute({
      id: ROLE_ID,
      tenantId: TENANT_ID,
      name: 'Owner',
      permissions: [PermissionCatalog.identityUsersRead, PermissionCatalog.tenancyMembersRead],
      isSystem: true,
    })

    expect(role.isSystem).toBe(true)
    expect(role.permissions).toEqual([PermissionCatalog.tenancyMembersRead, PermissionCatalog.identityUsersRead])
    expect(role.pullEvents()).toEqual([])
  })

  it('equals another Role with the same id', () => {
    const left = Role.reconstitute({
      id: ROLE_ID,
      tenantId: TENANT_ID,
      name: 'Owner',
      permissions: PermissionCatalog.all,
      isSystem: true,
    })
    const right = Role.reconstitute({
      id: ROLE_ID,
      tenantId: TENANT_ID,
      name: 'Member',
      permissions: [PermissionCatalog.tenancyTenantRead],
      isSystem: true,
    })
    const other = Role.reconstitute({
      id: OTHER_ROLE_ID,
      tenantId: TENANT_ID,
      name: 'Owner',
      permissions: PermissionCatalog.all,
      isSystem: true,
    })

    expect(left.equals(right)).toBe(true)
    expect(left.equals(other)).toBe(false)
  })
})
