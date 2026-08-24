import {describe, expect, it} from 'vitest'

import {MembershipId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Membership} from '@b2b-saas-starter-kit/domain'

import {InMemoryMembershipRepository} from '../testing/in-memory-membership.repository'

import {MembershipRolesService} from './membership-roles.service'

const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')
const USER_ID = UserId.parse('11111111-1111-4111-8111-111111111111')
const TENANT_ID = TenantId.parse('33333333-3333-4333-8333-333333333333')
const ROLE_ID = RoleId.parse('77777777-7777-4777-8777-777777777777')
const MEMBERSHIP_ID = MembershipId.parse('55555555-5555-4555-8555-555555555555')

describe('MembershipRolesService', () => {
  it('returns role ids for an active membership', async () => {
    const memberships = new InMemoryMembershipRepository()
    const service = new MembershipRolesService(memberships)

    await memberships.save(Membership.createOwner(MEMBERSHIP_ID, TENANT_ID, USER_ID, ROLE_ID, OCCURRED_AT))

    await expect(service.roleIdsFor(USER_ID, TENANT_ID)).resolves.toEqual([ROLE_ID])
  })

  it('returns an empty list when the membership is not active or missing', async () => {
    const memberships = new InMemoryMembershipRepository()
    const service = new MembershipRolesService(memberships)

    await memberships.save(
      Membership.reconstitute({
        id: MEMBERSHIP_ID,
        tenantId: TENANT_ID,
        userId: USER_ID,
        roleIds: [ROLE_ID],
        status: 'invited',
      }),
    )

    await expect(service.roleIdsFor(USER_ID, TENANT_ID)).resolves.toEqual([])
    await expect(service.roleIdsFor(USER_ID, TenantId.parse('44444444-4444-4444-8444-444444444444'))).resolves.toEqual(
      [],
    )
  })
})
