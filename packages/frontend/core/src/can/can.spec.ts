import {PermissionName} from '@b2b-saas-starter-kit/contracts'

import {can} from './can'

describe('can', () => {
  it('allows when the permission is present', () => {
    expect(can([PermissionName.tenancyMembersRead], PermissionName.tenancyMembersRead)).toBe(true)
  })

  it('denies when the permission is missing', () => {
    expect(can([PermissionName.tenancyTenantRead], PermissionName.tenancyMembersRead)).toBe(false)
  })
})
