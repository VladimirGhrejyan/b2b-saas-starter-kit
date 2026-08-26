import {describe, expect, it} from 'vitest'

import {PermissionName, permissionSchema} from './permission'

describe('permissionSchema', () => {
  it('parses catalog permissions', () => {
    expect(permissionSchema.parse(PermissionName.tenancyMembersRead)).toBe('tenancy.members.read')
    expect(permissionSchema.parse(PermissionName.identityUsersRead)).toBe('identity.users.read')
  })

  it('rejects an unknown permission', () => {
    expect(permissionSchema.safeParse('tenancy.members.write').success).toBe(false)
  })
})
