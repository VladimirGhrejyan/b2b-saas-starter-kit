import {describe, expect, it} from 'vitest'

import {MembershipId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Membership, PermissionCatalog, User} from '@b2b-saas-starter-kit/domain'

import type {AuthorizationPort} from '../shared/authorization.port'
import {InMemoryMembershipRepository} from '../testing/in-memory-membership.repository'
import {InMemoryUserRepository} from '../testing/in-memory-user.repository'

import {UserNotFoundError} from './errors/user-not-found.error'
import {GetMyProfileQuery} from './get-my-profile.query'

const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')
const ACTOR_ID = UserId.parse('11111111-1111-4111-8111-111111111111')
const UNKNOWN_ID = UserId.parse('22222222-2222-4222-8222-222222222222')
const TENANT_ID = TenantId.parse('33333333-3333-4333-8333-333333333333')
const ROLE_ID = RoleId.parse('77777777-7777-4777-8777-777777777777')
const MEMBERSHIP_ID = MembershipId.parse('55555555-5555-4555-8555-555555555555')

function authzWith(permissions: AuthorizationPort['getEffectivePermissions']): AuthorizationPort {
  return {
    async require() {
      return undefined
    },
    getEffectivePermissions: permissions,
  }
}

describe('GetMyProfileQuery', () => {
  it('returns the user, active-tenant membership, and effective permissions', async () => {
    const users = new InMemoryUserRepository()
    const memberships = new InMemoryMembershipRepository()

    await users.save(User.create(ACTOR_ID, 'ada@example.com', 'Ada', OCCURRED_AT))
    await memberships.save(Membership.createOwner(MEMBERSHIP_ID, TENANT_ID, ACTOR_ID, ROLE_ID, OCCURRED_AT))

    const query = new GetMyProfileQuery(
      users,
      memberships,
      authzWith(async () => PermissionCatalog.all),
    )
    const result = await query.execute({actorId: ACTOR_ID, tenantId: TENANT_ID})

    expect(result.user).toEqual({
      id: ACTOR_ID,
      email: 'ada@example.com',
      displayName: 'Ada',
      status: 'active',
    })
    expect(result.membership).toEqual({
      membershipId: MEMBERSHIP_ID,
      tenantId: TENANT_ID,
      roleIds: [ROLE_ID],
      status: 'active',
    })
    expect(result.effectivePermissions).toEqual([...PermissionCatalog.all])
  })

  it('returns a null membership and empty permissions when the actor is not a member', async () => {
    const users = new InMemoryUserRepository()
    const memberships = new InMemoryMembershipRepository()

    await users.save(User.create(ACTOR_ID, 'ada@example.com', 'Ada', OCCURRED_AT))

    const query = new GetMyProfileQuery(
      users,
      memberships,
      authzWith(async () => []),
    )
    const result = await query.execute({actorId: ACTOR_ID, tenantId: TENANT_ID})

    expect(result.membership).toBeNull()
    expect(result.effectivePermissions).toEqual([])
  })

  it('throws when the actor user does not exist', async () => {
    const query = new GetMyProfileQuery(
      new InMemoryUserRepository(),
      new InMemoryMembershipRepository(),
      authzWith(async () => []),
    )

    await expect(query.execute({actorId: UNKNOWN_ID, tenantId: TENANT_ID})).rejects.toBeInstanceOf(UserNotFoundError)
  })
})
