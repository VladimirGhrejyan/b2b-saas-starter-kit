import {
  errorOutputSchema,
  meOutputSchema,
  PermissionName,
  tenantMembersOutputSchema,
} from '@b2b-saas-starter-kit/contracts'
import {MembershipId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'
import type {SessionState} from '@b2b-saas-starter-kit/frontend-core'

export const fixtureIds = {
  ownerUserId: UserId.parse('11111111-1111-4111-8111-111111111111'),
  memberUserId: UserId.parse('22222222-2222-4222-8222-222222222222'),
  tenantId: TenantId.parse('33333333-3333-4333-8333-333333333333'),
  ownerMembershipId: MembershipId.parse('44444444-4444-4444-8444-444444444444'),
  memberMembershipId: MembershipId.parse('55555555-5555-4555-8555-555555555555'),
  ownerRoleId: RoleId.parse('66666666-6666-4666-8666-666666666666'),
  memberRoleId: RoleId.parse('77777777-7777-4777-8777-777777777777'),
}

export const ownerMe = meOutputSchema.parse({
  user: {
    id: fixtureIds.ownerUserId,
    email: 'owner@example.com',
    displayName: 'Owner',
    status: 'active',
  },
  membership: {
    membershipId: fixtureIds.ownerMembershipId,
    tenantId: fixtureIds.tenantId,
    roleIds: [fixtureIds.ownerRoleId],
    status: 'active',
  },
  effectivePermissions: [
    PermissionName.tenancyMembersRead,
    PermissionName.tenancyTenantRead,
    PermissionName.authorizationRolesRead,
    PermissionName.identityUsersRead,
  ],
})

export const memberMe = meOutputSchema.parse({
  user: {
    id: fixtureIds.memberUserId,
    email: 'member@example.com',
    displayName: 'Member',
    status: 'active',
  },
  membership: {
    membershipId: fixtureIds.memberMembershipId,
    tenantId: fixtureIds.tenantId,
    roleIds: [fixtureIds.memberRoleId],
    status: 'active',
  },
  effectivePermissions: [PermissionName.tenancyTenantRead, PermissionName.identityUsersRead],
})

export const ownerMembers = tenantMembersOutputSchema.parse({
  members: [
    {
      membershipId: fixtureIds.ownerMembershipId,
      userId: fixtureIds.ownerUserId,
      roleIds: [fixtureIds.ownerRoleId],
      status: 'active',
    },
    {
      membershipId: fixtureIds.memberMembershipId,
      userId: fixtureIds.memberUserId,
      roleIds: [fixtureIds.memberRoleId],
      status: 'active',
    },
  ],
})

export const unauthorizedError = errorOutputSchema.parse({
  code: 'UNAUTHORIZED',
  message: 'Missing authenticated user',
})

export const forbiddenError = errorOutputSchema.parse({
  code: 'INSUFFICIENT_PERMISSION',
  message: "missing permission 'tenancy.members.read'",
})

export const ownerSession: SessionState = {
  userId: fixtureIds.ownerUserId,
  activeTenantId: fixtureIds.tenantId,
  effectivePermissions: [],
}

export const memberSession: SessionState = {
  userId: fixtureIds.memberUserId,
  activeTenantId: fixtureIds.tenantId,
  effectivePermissions: [],
}
