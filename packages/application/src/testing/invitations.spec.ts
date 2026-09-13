import {describe, expect, it} from 'vitest'

import {MembershipId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Membership, PermissionCatalog, Role, User} from '@b2b-saas-starter-kit/domain'

import {AuthorizationService} from '../authorization/authorization.service'
import {effectivePermissionsCacheKey} from '../authorization/effective-permissions-cache-key'
import {InsufficientPermissionError} from '../shared/errors/insufficient-permission.error'
import {AcceptInvitationUseCase} from '../tenancy/accept-invitation/accept-invitation.use-case'
import {AttachMemberUseCase} from '../tenancy/attach-member/attach-member.use-case'
import {CannotAssignOwnerRoleError} from '../tenancy/errors/cannot-assign-owner-role.error'
import {InvitationAlreadyPendingError} from '../tenancy/errors/invitation-already-pending.error'
import {LastOwnerRequiredError} from '../tenancy/errors/last-owner-required.error'
import {InviteMemberUseCase} from '../tenancy/invite-member/invite-member.use-case'
import {MembershipRolesService} from '../tenancy/membership-roles.service'
import {ReplaceMembershipRolesUseCase} from '../tenancy/replace-membership-roles/replace-membership-roles.use-case'

import {FixedClock} from './fixed-clock'
import {InMemoryCache} from './in-memory-cache'
import {InMemoryInvitationRepository} from './in-memory-invitation.repository'
import {InMemoryLocalPasswordRepository} from './in-memory-local-password.repository'
import {InMemoryMailer} from './in-memory-mailer'
import {InMemoryMembershipRepository} from './in-memory-membership.repository'
import {InMemoryPasswordHasher} from './in-memory-password-hasher'
import {InMemoryRoleRepository} from './in-memory-role.repository'
import {InMemoryTokenDigest} from './in-memory-token-digest'
import {InMemoryUnitOfWork} from './in-memory-unit-of-work'
import {InMemoryUserRepository} from './in-memory-user.repository'
import {SequentialIdGenerator} from './sequential-id-generator'

const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')
const OWNER_ID = UserId.parse('11111111-1111-4111-8111-111111111111')
const MEMBER_ID = UserId.parse('22222222-2222-4222-8222-222222222222')
const TENANT_ID = TenantId.parse('33333333-3333-4333-8333-333333333333')
const OWNER_ROLE_ID = RoleId.parse('77777777-7777-4777-8777-777777777777')
const ADMIN_ROLE_ID = RoleId.parse('88888888-8888-4888-8888-888888888888')
const MEMBER_ROLE_ID = RoleId.parse('99999999-9999-4999-8999-999999999999')
const OWNER_MEMBERSHIP = MembershipId.parse('55555555-5555-4555-8555-555555555555')

function readInviteToken(text: string): string {
  return text.replace('invitation token: ', '')
}

async function createHarness() {
  const users = new InMemoryUserRepository()
  const passwords = new InMemoryLocalPasswordRepository()
  const memberships = new InMemoryMembershipRepository()
  const roles = new InMemoryRoleRepository()
  const invitations = new InMemoryInvitationRepository()
  const cache = new InMemoryCache()
  const mailer = new InMemoryMailer()
  const digest = new InMemoryTokenDigest()
  const hasher = new InMemoryPasswordHasher()
  const ids = new SequentialIdGenerator()
  const uow = new InMemoryUnitOfWork(users, passwords, memberships, roles, invitations)
  const authz = new AuthorizationService(roles, new MembershipRolesService(memberships), cache, memberships)
  const invite = new InviteMemberUseCase(
    uow,
    new FixedClock(OCCURRED_AT),
    ids,
    digest,
    mailer,
    authz,
    users,
    memberships,
    roles,
    invitations,
  )
  const accept = new AcceptInvitationUseCase(
    uow,
    new FixedClock(OCCURRED_AT),
    ids,
    hasher,
    digest,
    authz,
    users,
    passwords,
    memberships,
    invitations,
  )
  const attach = new AttachMemberUseCase(uow, new FixedClock(OCCURRED_AT), ids, authz, users, memberships, roles)
  const replaceRoles = new ReplaceMembershipRolesUseCase(uow, new FixedClock(OCCURRED_AT), authz, memberships, roles)

  await users.save(User.create(OWNER_ID, 'owner@example.com', 'Owner', OCCURRED_AT))
  await roles.save(Role.createSystemRole(OWNER_ROLE_ID, TENANT_ID, 'Owner', OCCURRED_AT))
  await roles.save(Role.createSystemRole(ADMIN_ROLE_ID, TENANT_ID, 'Admin', OCCURRED_AT))
  await roles.save(Role.createSystemRole(MEMBER_ROLE_ID, TENANT_ID, 'Member', OCCURRED_AT))
  await memberships.save(Membership.createOwner(OWNER_MEMBERSHIP, TENANT_ID, OWNER_ID, OWNER_ROLE_ID, OCCURRED_AT))

  return {users, memberships, roles, invitations, cache, mailer, invite, accept, attach, replaceRoles, authz}
}

describe('invitations and membership writes', () => {
  it('invites an unknown email, accepts as a new user, and invalidates the cache', async () => {
    const {mailer, invite, accept, authz, cache} = await createHarness()

    await authz.getEffectivePermissions(OWNER_ID, TENANT_ID)
    const invited = await invite.execute({
      actorId: OWNER_ID,
      tenantId: TENANT_ID,
      email: 'new@example.com',
      roleIds: [MEMBER_ROLE_ID],
    })

    expect(invited.invitationId).toBeTruthy()
    expect(mailer.messages).toHaveLength(1)

    const accepted = await accept.execute({
      token: readInviteToken(mailer.messages[0].text),
      displayName: 'New',
      password: 'secret-password',
    })

    expect(accepted.tenantId).toBe(TENANT_ID)
    await expect(cache.get(effectivePermissionsCacheKey(TENANT_ID, accepted.userId))).resolves.toBeNull()
    await expect(authz.getEffectivePermissions(accepted.userId, TENANT_ID)).resolves.toEqual([
      PermissionCatalog.tenancyTenantRead,
    ])
  })

  it('attaches an existing user and drops their cached permissions', async () => {
    const {users, attach, authz, cache} = await createHarness()

    await users.save(User.create(MEMBER_ID, 'mel@example.com', 'Mel', OCCURRED_AT))
    await authz.getEffectivePermissions(MEMBER_ID, TENANT_ID)

    const attached = await attach.execute({
      actorId: OWNER_ID,
      tenantId: TENANT_ID,
      userId: MEMBER_ID,
      roleIds: [ADMIN_ROLE_ID],
    })

    expect(attached.membershipId).toBeTruthy()
    await expect(cache.get(effectivePermissionsCacheKey(TENANT_ID, MEMBER_ID))).resolves.toBeNull()
    const permissions = await authz.getEffectivePermissions(MEMBER_ID, TENANT_ID)

    expect(permissions).toContain(PermissionCatalog.tenancyMembersInvite)
    expect(permissions).not.toContain(PermissionCatalog.authorizationRolesManage)
  })

  it('rejects assigning the Owner role and a second pending invite', async () => {
    const {invite} = await createHarness()

    await expect(
      invite.execute({
        actorId: OWNER_ID,
        tenantId: TENANT_ID,
        email: 'new@example.com',
        roleIds: [OWNER_ROLE_ID],
      }),
    ).rejects.toBeInstanceOf(CannotAssignOwnerRoleError)

    await invite.execute({
      actorId: OWNER_ID,
      tenantId: TENANT_ID,
      email: 'new@example.com',
      roleIds: [MEMBER_ROLE_ID],
    })

    await expect(
      invite.execute({
        actorId: OWNER_ID,
        tenantId: TENANT_ID,
        email: 'new@example.com',
        roleIds: [MEMBER_ROLE_ID],
      }),
    ).rejects.toBeInstanceOf(InvitationAlreadyPendingError)
  })

  it('refuses replacing the last Owner membership', async () => {
    const {replaceRoles} = await createHarness()

    await expect(
      replaceRoles.execute({
        actorId: OWNER_ID,
        tenantId: TENANT_ID,
        membershipId: OWNER_MEMBERSHIP,
        roleIds: [MEMBER_ROLE_ID],
      }),
    ).rejects.toBeInstanceOf(LastOwnerRequiredError)
  })

  it('denies a Member from inviting', async () => {
    const {users, memberships, invite} = await createHarness()
    const memberMembership = MembershipId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')

    await users.save(User.create(MEMBER_ID, 'mel@example.com', 'Mel', OCCURRED_AT))
    await memberships.save(Membership.create(memberMembership, TENANT_ID, MEMBER_ID, [MEMBER_ROLE_ID], OCCURRED_AT))

    await expect(
      invite.execute({
        actorId: MEMBER_ID,
        tenantId: TENANT_ID,
        email: 'new@example.com',
        roleIds: [MEMBER_ROLE_ID],
      }),
    ).rejects.toBeInstanceOf(InsufficientPermissionError)
  })
})
