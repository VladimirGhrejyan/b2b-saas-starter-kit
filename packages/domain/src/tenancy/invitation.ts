import type {InvitationId, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {AggregateRoot} from '../shared-kernel/aggregate-root'
import {Guard} from '../shared-kernel/guard'

import {EmptyMembershipRolesError} from './errors/empty-membership-roles.error'
import {InvalidInvitationEmailError} from './errors/invalid-invitation-email.error'
import {InvitationAlreadyConsumedError} from './errors/invitation-already-consumed.error'
import {InvitationExpiredError} from './errors/invitation-expired.error'
import type {InvitationReconstituteProps} from './invitation.types'

/**
 * Email invitation with a hashed token. The raw token is never stored.
 *
 * A membership is created only when the invitation is consumed.
 */
export class Invitation extends AggregateRoot<InvitationId> {
  readonly tenantId: TenantId

  readonly email: string

  readonly roleIds: readonly RoleId[]

  readonly tokenHash: string

  readonly expiresAt: Date

  readonly invitedByUserId: UserId

  #consumedAt: Date | undefined

  private constructor(
    id: InvitationId,
    tenantId: TenantId,
    email: string,
    roleIds: readonly RoleId[],
    tokenHash: string,
    expiresAt: Date,
    invitedByUserId: UserId,
    consumedAt: Date | undefined,
  ) {
    super(id)
    this.tenantId = tenantId
    this.email = email
    this.roleIds = roleIds
    this.tokenHash = tokenHash
    this.expiresAt = expiresAt
    this.invitedByUserId = invitedByUserId
    this.#consumedAt = consumedAt
  }

  get consumedAt(): Date | undefined {
    return this.#consumedAt
  }

  /**
   * Creates a pending invitation. Email is trimmed and lowercased. Raw token is not stored.
   */
  static create(
    id: InvitationId,
    tenantId: TenantId,
    email: string,
    roleIds: readonly RoleId[],
    tokenHash: string,
    expiresAt: Date,
    invitedByUserId: UserId,
    occurredAt: Date,
  ): Invitation {
    const invitation = new Invitation(
      id,
      tenantId,
      Invitation.#normalizeEmail(email),
      Invitation.#normalizeRoleIds(roleIds),
      tokenHash,
      expiresAt,
      invitedByUserId,
      undefined,
    )

    invitation.record({
      type: 'InvitationCreated',
      occurredAt,
      invitationId: id,
      tenantId,
      email: invitation.email,
      invitedByUserId,
    })

    return invitation
  }

  /**
   * Rebuilds an invitation from persistence without recording events.
   */
  static reconstitute(props: InvitationReconstituteProps): Invitation {
    return new Invitation(
      props.id,
      props.tenantId,
      props.email,
      [...props.roleIds],
      props.tokenHash,
      props.expiresAt,
      props.invitedByUserId,
      props.consumedAt,
    )
  }

  consume(at: Date): void {
    if (this.#consumedAt !== undefined) {
      throw new InvitationAlreadyConsumedError()
    }

    if (this.expiresAt.getTime() <= at.getTime()) {
      throw new InvitationExpiredError()
    }

    this.#consumedAt = at

    this.record({
      type: 'InvitationConsumed',
      occurredAt: at,
      invitationId: this.id,
      tenantId: this.tenantId,
      email: this.email,
    })
  }

  /**
   * Marks an expired unused invitation consumed so a new pending invite can be stored.
   */
  supersede(at: Date): void {
    if (this.#consumedAt !== undefined) {
      throw new InvitationAlreadyConsumedError()
    }

    this.#consumedAt = at
  }

  isActive(now: Date): boolean {
    return this.#consumedAt === undefined && this.expiresAt.getTime() > now.getTime()
  }

  static #normalizeEmail(email: string): string {
    Guard.againstEmpty(email, new InvalidInvitationEmailError())

    const normalized = email.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new InvalidInvitationEmailError()
    }

    return normalized
  }

  static #normalizeRoleIds(roleIds: readonly RoleId[]): RoleId[] {
    const unique: RoleId[] = []

    for (const roleId of roleIds) {
      if (!unique.includes(roleId)) {
        unique.push(roleId)
      }
    }

    if (unique.length === 0) {
      throw new EmptyMembershipRolesError()
    }

    return unique
  }
}
