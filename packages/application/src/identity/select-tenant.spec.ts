import {describe, expect, it} from 'vitest'

import {MembershipId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Membership} from '@b2b-saas-starter-kit/domain'

import {InMemoryMembershipRepository} from '../testing/in-memory-membership.repository'

import {ActiveMembershipRequiredError} from './errors/active-membership-required.error'
import {SelectTenantUseCase} from './select-tenant.use-case'

const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')
const USER_ID = UserId.parse('11111111-1111-4111-8111-111111111111')
const TENANT_ID = TenantId.parse('22222222-2222-4222-8222-222222222222')
const OTHER_TENANT = TenantId.parse('33333333-3333-4333-8333-333333333333')
const ROLE_ID = RoleId.parse('44444444-4444-4444-8444-444444444444')

function createUseCase() {
  const memberships = new InMemoryMembershipRepository()
  const useCase = new SelectTenantUseCase(memberships)

  return {memberships, useCase}
}

describe('SelectTenantUseCase', () => {
  it('returns the tenant when the membership is active', async () => {
    const {memberships, useCase} = createUseCase()

    await memberships.save(
      Membership.create(
        MembershipId.parse('55555555-5555-4555-8555-555555555555'),
        TENANT_ID,
        USER_ID,
        [ROLE_ID],
        OCCURRED_AT,
      ),
    )

    await expect(useCase.execute({userId: USER_ID, tenantId: TENANT_ID})).resolves.toEqual({
      userId: USER_ID,
      tenantId: TENANT_ID,
    })
  })

  it('denies a user who is not a member', async () => {
    const {useCase} = createUseCase()

    await expect(useCase.execute({userId: USER_ID, tenantId: OTHER_TENANT})).rejects.toBeInstanceOf(
      ActiveMembershipRequiredError,
    )
  })
})
