import {describe, expect, it} from 'vitest'

import {MembershipId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Membership, PermissionCatalog, User} from '@b2b-saas-starter-kit/domain'

import type {AuthorizationPort} from '../../shared/authorization.port'
import {InsufficientPermissionError} from '../../shared/errors/insufficient-permission.error'
import {InMemoryMembershipRepository} from '../../testing/in-memory-membership.repository'
import {InMemoryUserRepository} from '../../testing/in-memory-user.repository'

import {ListTenantMembersQuery} from './list-tenant-members.query'

const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')
const ACTOR_ID = UserId.parse('11111111-1111-4111-8111-111111111111')
const TENANT_ID = TenantId.parse('33333333-3333-4333-8333-333333333333')
const ROLE_ID = RoleId.parse('77777777-7777-4777-8777-777777777777')
const MEMBERSHIP_ID = MembershipId.parse('55555555-5555-4555-8555-555555555555')

function allowingAuthz(): AuthorizationPort {
  return {
    async require() {
      return undefined
    },
    async getEffectivePermissions() {
      return []
    },
    async invalidate() {
      return undefined
    },
    async invalidateHoldersOf() {
      return undefined
    },
  }
}

function denyingAuthz(): AuthorizationPort {
  return {
    async require(_actorId, permission) {
      throw new InsufficientPermissionError(permission)
    },
    async getEffectivePermissions() {
      return []
    },
    async invalidate() {
      return undefined
    },
    async invalidateHoldersOf() {
      return undefined
    },
  }
}

describe('ListTenantMembersQuery', () => {
  it('returns ID-level memberships after authorization succeeds', async () => {
    const memberships = new InMemoryMembershipRepository()

    await memberships.save(Membership.createOwner(MEMBERSHIP_ID, TENANT_ID, ACTOR_ID, ROLE_ID, OCCURRED_AT))

    const query = new ListTenantMembersQuery(allowingAuthz(), memberships, new InMemoryUserRepository())
    const result = await query.execute({tenantId: TENANT_ID, actorId: ACTOR_ID})

    expect(result.members).toEqual([
      {
        membershipId: MEMBERSHIP_ID,
        userId: ACTOR_ID,
        roleIds: [ROLE_ID],
        status: 'active',
      },
    ])
  })

  it('does not list members when authorization denies', async () => {
    const memberships = new InMemoryMembershipRepository()

    await memberships.save(Membership.createOwner(MEMBERSHIP_ID, TENANT_ID, ACTOR_ID, ROLE_ID, OCCURRED_AT))

    const query = new ListTenantMembersQuery(denyingAuthz(), memberships, new InMemoryUserRepository())

    await expect(query.execute({tenantId: TENANT_ID, actorId: ACTOR_ID})).rejects.toBeInstanceOf(
      InsufficientPermissionError,
    )
  })

  it('includes user PII when the actor has identity.users.read', async () => {
    const memberships = new InMemoryMembershipRepository()
    const users = new InMemoryUserRepository()

    await users.save(User.create(ACTOR_ID, 'ada@example.com', 'Ada', OCCURRED_AT))
    await memberships.save(Membership.createOwner(MEMBERSHIP_ID, TENANT_ID, ACTOR_ID, ROLE_ID, OCCURRED_AT))

    const authz: AuthorizationPort = {
      ...allowingAuthz(),
      async getEffectivePermissions() {
        return [PermissionCatalog.identityUsersRead]
      },
    }
    const query = new ListTenantMembersQuery(authz, memberships, users)
    const result = await query.execute({tenantId: TENANT_ID, actorId: ACTOR_ID})

    expect(result.members[0]?.user).toEqual({email: 'ada@example.com', displayName: 'Ada'})
  })
})
