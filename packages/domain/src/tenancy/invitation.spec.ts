import {describe, expect, it} from 'vitest'

import {InvitationId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {EmptyMembershipRolesError} from './errors/empty-membership-roles.error'
import {InvalidInvitationEmailError} from './errors/invalid-invitation-email.error'
import {InvitationAlreadyConsumedError} from './errors/invitation-already-consumed.error'
import {InvitationExpiredError} from './errors/invitation-expired.error'
import {Invitation} from './invitation'

const INVITATION_ID = InvitationId.parse('99999999-9999-4999-8999-999999999999')
const TENANT_ID = TenantId.parse('33333333-3333-4333-8333-333333333333')
const INVITER_ID = UserId.parse('11111111-1111-4111-8111-111111111111')
const ROLE_ID = RoleId.parse('88888888-8888-4888-8888-888888888888')
const OTHER_ROLE_ID = RoleId.parse('77777777-7777-4777-8777-777777777777')
const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')
const EXPIRES_AT = new Date('2026-01-08T00:00:00.000Z')
const TOKEN_HASH = 'hashed-token'

describe('Invitation', () => {
  it('create normalizes email and role ids and records InvitationCreated', () => {
    const invitation = Invitation.create(
      INVITATION_ID,
      TENANT_ID,
      '  Ada@Example.com ',
      [ROLE_ID, OTHER_ROLE_ID, ROLE_ID],
      TOKEN_HASH,
      EXPIRES_AT,
      INVITER_ID,
      OCCURRED_AT,
    )

    expect(invitation.email).toBe('ada@example.com')
    expect(invitation.roleIds).toEqual([ROLE_ID, OTHER_ROLE_ID])
    expect(invitation.tokenHash).toBe(TOKEN_HASH)
    expect(invitation.isActive(OCCURRED_AT)).toBe(true)
    expect(invitation.pullEvents()).toEqual([
      {
        type: 'InvitationCreated',
        occurredAt: OCCURRED_AT,
        invitationId: INVITATION_ID,
        tenantId: TENANT_ID,
        email: 'ada@example.com',
        invitedByUserId: INVITER_ID,
      },
    ])
  })

  it('rejects a blank email and empty role ids', () => {
    expect(() => {
      Invitation.create(INVITATION_ID, TENANT_ID, '  ', [ROLE_ID], TOKEN_HASH, EXPIRES_AT, INVITER_ID, OCCURRED_AT)
    }).toThrow(InvalidInvitationEmailError)
    expect(() => {
      Invitation.create(
        INVITATION_ID,
        TENANT_ID,
        'ada@example.com',
        [],
        TOKEN_HASH,
        EXPIRES_AT,
        INVITER_ID,
        OCCURRED_AT,
      )
    }).toThrow(EmptyMembershipRolesError)
  })

  it('consume marks the invitation inactive and records InvitationConsumed', () => {
    const invitation = Invitation.create(
      INVITATION_ID,
      TENANT_ID,
      'ada@example.com',
      [ROLE_ID],
      TOKEN_HASH,
      EXPIRES_AT,
      INVITER_ID,
      OCCURRED_AT,
    )

    invitation.pullEvents()
    invitation.consume(OCCURRED_AT)

    expect(invitation.consumedAt).toEqual(OCCURRED_AT)
    expect(invitation.isActive(OCCURRED_AT)).toBe(false)
    expect(invitation.pullEvents()[0]).toMatchObject({type: 'InvitationConsumed'})
    expect(() => {
      invitation.consume(OCCURRED_AT)
    }).toThrow(InvitationAlreadyConsumedError)
  })

  it('is expired at expiresAt and refuses consume after expiry', () => {
    const invitation = Invitation.reconstitute({
      id: INVITATION_ID,
      tenantId: TENANT_ID,
      email: 'ada@example.com',
      roleIds: [ROLE_ID],
      tokenHash: TOKEN_HASH,
      expiresAt: EXPIRES_AT,
      invitedByUserId: INVITER_ID,
    })

    expect(invitation.isActive(EXPIRES_AT)).toBe(false)
    expect(invitation.isActive(new Date(EXPIRES_AT.getTime() - 1))).toBe(true)
    expect(() => {
      invitation.consume(EXPIRES_AT)
    }).toThrow(InvitationExpiredError)

    invitation.supersede(EXPIRES_AT)

    expect(invitation.consumedAt).toEqual(EXPIRES_AT)
    expect(invitation.isActive(OCCURRED_AT)).toBe(false)
  })
})
