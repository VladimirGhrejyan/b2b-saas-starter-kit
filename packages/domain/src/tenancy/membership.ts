import type {MembershipId, MembershipStatus, RoleId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'
import {MembershipStatus as MembershipStatusEnum} from '@b2b-saas-starter-kit/shared-kernel-types'

import {AggregateRoot} from '../shared-kernel/aggregate-root'

import {EmptyMembershipRolesError} from './errors/empty-membership-roles.error'
import {MembershipAlreadyActiveError} from './errors/membership-already-active.error'
import {MembershipAlreadySuspendedError} from './errors/membership-already-suspended.error'
import type {MembershipReconstituteProps} from './membership.types'

/**
 * User↔tenant link with tenant-scoped role ids. Does not import User or Role.
 */
export class Membership extends AggregateRoot<MembershipId> {
  readonly tenantId: TenantId

  readonly userId: UserId

  readonly roleIds: readonly RoleId[]

  #status: MembershipStatus

  private constructor(
    id: MembershipId,
    tenantId: TenantId,
    userId: UserId,
    roleIds: readonly RoleId[],
    status: MembershipStatus,
  ) {
    super(id)
    this.tenantId = tenantId
    this.userId = userId
    this.roleIds = roleIds
    this.#status = status
  }

  get status(): MembershipStatus {
    return this.#status
  }

  /**
   * Creates the founding owner membership (`active`, one role id).
   */
  static createOwner(
    id: MembershipId,
    tenantId: TenantId,
    userId: UserId,
    ownerRoleId: RoleId,
    occurredAt: Date,
  ): Membership {
    return Membership.#instantiate(
      id,
      tenantId,
      userId,
      [ownerRoleId],
      MembershipStatusEnum.parse('active'),
      occurredAt,
    )
  }

  /**
   * Creates an active membership with a non-empty, unique role-id list.
   */
  static create(
    id: MembershipId,
    tenantId: TenantId,
    userId: UserId,
    roleIds: readonly RoleId[],
    occurredAt: Date,
  ): Membership {
    return Membership.#instantiate(
      id,
      tenantId,
      userId,
      Membership.#normalizeRoleIds(roleIds),
      MembershipStatusEnum.parse('active'),
      occurredAt,
    )
  }

  /**
   * Rebuilds a membership from persistence without recording events.
   */
  static reconstitute(props: MembershipReconstituteProps): Membership {
    return new Membership(props.id, props.tenantId, props.userId, [...props.roleIds], props.status)
  }

  /**
   * Transitions `invited` or `suspended` → `active`.
   */
  activate(occurredAt: Date): void {
    if (this.#status === 'active') {
      throw new MembershipAlreadyActiveError()
    }

    this.#status = MembershipStatusEnum.parse('active')

    this.record({
      type: 'MembershipActivated',
      occurredAt,
      membershipId: this.id,
      tenantId: this.tenantId,
      userId: this.userId,
    })
  }

  /**
   * Transitions `invited` or `active` → `suspended`.
   */
  suspend(occurredAt: Date): void {
    if (this.#status === 'suspended') {
      throw new MembershipAlreadySuspendedError()
    }

    this.#status = MembershipStatusEnum.parse('suspended')

    this.record({
      type: 'MembershipSuspended',
      occurredAt,
      membershipId: this.id,
      tenantId: this.tenantId,
      userId: this.userId,
    })
  }

  static #instantiate(
    id: MembershipId,
    tenantId: TenantId,
    userId: UserId,
    roleIds: readonly RoleId[],
    status: MembershipStatus,
    occurredAt: Date,
  ): Membership {
    const membership = new Membership(id, tenantId, userId, roleIds, status)

    membership.record({
      type: 'MembershipCreated',
      occurredAt,
      membershipId: id,
      tenantId,
      userId,
      roleIds: [...roleIds],
      status,
    })

    return membership
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
