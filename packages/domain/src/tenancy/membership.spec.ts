import {describe, expect, it} from 'vitest'

import {MembershipId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {EmptyMembershipRolesError} from './errors/empty-membership-roles.error'
import {MembershipAlreadyActiveError} from './errors/membership-already-active.error'
import {MembershipAlreadySuspendedError} from './errors/membership-already-suspended.error'
import {Membership} from './membership'

const MEMBERSHIP_ID = MembershipId.parse('55555555-5555-4555-8555-555555555555')
const OTHER_ID = MembershipId.parse('66666666-6666-4666-8666-666666666666')
const TENANT_ID = TenantId.parse('33333333-3333-4333-8333-333333333333')
const USER_ID = UserId.parse('11111111-1111-4111-8111-111111111111')
const OWNER_ROLE_ID = RoleId.parse('77777777-7777-4777-8777-777777777777')
const MEMBER_ROLE_ID = RoleId.parse('88888888-8888-4888-8888-888888888888')
const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')

describe('Membership', () => {
  it('createOwner is active with a single role and records MembershipCreated', () => {
    const membership = Membership.createOwner(MEMBERSHIP_ID, TENANT_ID, USER_ID, OWNER_ROLE_ID, OCCURRED_AT)

    expect(membership.status).toBe('active')
    expect(membership.roleIds).toEqual([OWNER_ROLE_ID])
    expect(membership.tenantId).toBe(TENANT_ID)
    expect(membership.userId).toBe(USER_ID)
    expect(membership.pullEvents()).toEqual([
      {
        type: 'MembershipCreated',
        occurredAt: OCCURRED_AT,
        membershipId: MEMBERSHIP_ID,
        tenantId: TENANT_ID,
        userId: USER_ID,
        roleIds: [OWNER_ROLE_ID],
        status: 'active',
      },
    ])
    expect(membership.pullEvents()).toEqual([])
  })

  it('create rejects empty roleIds and dedupes', () => {
    expect(() => {
      Membership.create(MEMBERSHIP_ID, TENANT_ID, USER_ID, [], OCCURRED_AT)
    }).toThrow(EmptyMembershipRolesError)

    const membership = Membership.create(
      MEMBERSHIP_ID,
      TENANT_ID,
      USER_ID,
      [MEMBER_ROLE_ID, OWNER_ROLE_ID, MEMBER_ROLE_ID],
      OCCURRED_AT,
    )

    expect(membership.status).toBe('active')
    expect(membership.roleIds).toEqual([MEMBER_ROLE_ID, OWNER_ROLE_ID])
  })

  it('activates an invited membership and suspends an active one', () => {
    const invited = Membership.reconstitute({
      id: MEMBERSHIP_ID,
      tenantId: TENANT_ID,
      userId: USER_ID,
      roleIds: [MEMBER_ROLE_ID],
      status: 'invited',
    })

    invited.activate(OCCURRED_AT)

    expect(invited.status).toBe('active')
    expect(invited.pullEvents()[0]).toMatchObject({type: 'MembershipActivated'})
    expect(() => {
      invited.activate(OCCURRED_AT)
    }).toThrow(MembershipAlreadyActiveError)

    invited.suspend(OCCURRED_AT)

    expect(invited.status).toBe('suspended')
    expect(invited.pullEvents()[0]).toMatchObject({type: 'MembershipSuspended'})
    expect(() => {
      invited.suspend(OCCURRED_AT)
    }).toThrow(MembershipAlreadySuspendedError)
  })

  it('equals another Membership with the same id', () => {
    const left = Membership.reconstitute({
      id: MEMBERSHIP_ID,
      tenantId: TENANT_ID,
      userId: USER_ID,
      roleIds: [OWNER_ROLE_ID],
      status: 'active',
    })
    const right = Membership.reconstitute({
      id: MEMBERSHIP_ID,
      tenantId: TENANT_ID,
      userId: USER_ID,
      roleIds: [MEMBER_ROLE_ID],
      status: 'suspended',
    })
    const other = Membership.reconstitute({
      id: OTHER_ID,
      tenantId: TENANT_ID,
      userId: USER_ID,
      roleIds: [OWNER_ROLE_ID],
      status: 'active',
    })

    expect(left.equals(right)).toBe(true)
    expect(left.equals(other)).toBe(false)
  })
})
