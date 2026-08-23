import type {UserId, UserStatus} from '@b2b-saas-starter-kit/shared-kernel-types'
import {UserStatus as UserStatusEnum} from '@b2b-saas-starter-kit/shared-kernel-types'

import {AggregateRoot} from '../shared-kernel/aggregate-root'
import {Guard} from '../shared-kernel/guard'

import {InvalidUserDisplayNameError} from './errors/invalid-user-display-name.error'
import {InvalidUserEmailError} from './errors/invalid-user-email.error'
import {UserAlreadyActiveError} from './errors/user-already-active.error'
import {UserAlreadySuspendedError} from './errors/user-already-suspended.error'
import type {UserReconstituteProps} from './user.types'

/**
 * Global identity. No tenant, no credentials.
 */
export class User extends AggregateRoot<UserId> {
  readonly email: string

  readonly displayName: string

  #status: UserStatus

  private constructor(id: UserId, email: string, displayName: string, status: UserStatus) {
    super(id)
    this.email = email
    this.displayName = displayName
    this.#status = status
  }

  get status(): UserStatus {
    return this.#status
  }

  /**
   * Creates an active user. Email is trimmed and lowercased.
   */
  static create(id: UserId, email: string, displayName: string, occurredAt: Date): User {
    const user = new User(
      id,
      User.#normalizeEmail(email),
      User.#normalizeDisplayName(displayName),
      UserStatusEnum.parse('active'),
    )

    user.record({
      type: 'UserCreated',
      occurredAt,
      userId: id,
      email: user.email,
    })

    return user
  }

  /**
   * Rebuilds a user from persistence without recording events.
   */
  static reconstitute(props: UserReconstituteProps): User {
    return new User(props.id, props.email, props.displayName, props.status)
  }

  /**
   * Transitions `active` → `suspended`.
   */
  suspend(occurredAt: Date): void {
    if (this.#status === 'suspended') {
      throw new UserAlreadySuspendedError()
    }

    this.#status = UserStatusEnum.parse('suspended')

    this.record({
      type: 'UserSuspended',
      occurredAt,
      userId: this.id,
    })
  }

  /**
   * Transitions `suspended` → `active`.
   */
  activate(occurredAt: Date): void {
    if (this.#status === 'active') {
      throw new UserAlreadyActiveError()
    }

    this.#status = UserStatusEnum.parse('active')

    this.record({
      type: 'UserActivated',
      occurredAt,
      userId: this.id,
    })
  }

  static #normalizeEmail(email: string): string {
    Guard.againstEmpty(email, new InvalidUserEmailError())

    const normalized = email.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new InvalidUserEmailError()
    }

    return normalized
  }

  static #normalizeDisplayName(displayName: string): string {
    Guard.againstEmpty(displayName, new InvalidUserDisplayNameError())

    return displayName.trim()
  }
}
