import {describe, expect, it, vi} from 'vitest'

import {MembershipId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Membership} from '@b2b-saas-starter-kit/domain'

import type {TenantContext} from '@b2b-saas-starter-kit/platform'

import {AssertActiveMembership} from './assert-active-membership'

const userId = UserId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const tenantId = TenantId.parse('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
const membershipId = MembershipId.parse('cccccccc-cccc-4ccc-8ccc-cccccccccccc')
const roleId = RoleId.parse('dddddddd-dddd-4ddd-8ddd-dddddddddddd')

describe('AssertActiveMembership', () => {
  it('returns an active membership found without tenant scope', async () => {
    const membership = Membership.reconstitute({
      id: membershipId,
      tenantId,
      userId,
      roleIds: [roleId],
      status: 'active',
    })
    const findByUserAndTenant = vi.fn().mockResolvedValue(membership)
    const withoutTenantScope = vi.fn(async (work: () => Promise<unknown>) => work())
    const lookup = new AssertActiveMembership(
      {findByUserAndTenant} as never,
      {withoutTenantScope} as unknown as TenantContext,
    )

    await expect(lookup.findActive(userId, tenantId)).resolves.toBe(membership)
    expect(withoutTenantScope).toHaveBeenCalledOnce()
  })

  it('returns null when the membership is missing or not active', async () => {
    const lookup = new AssertActiveMembership(
      {findByUserAndTenant: vi.fn().mockResolvedValue(null)} as never,
      {withoutTenantScope: async (work: () => Promise<unknown>) => work()} as unknown as TenantContext,
    )

    await expect(lookup.findActive(userId, tenantId)).resolves.toBeNull()
  })
})
