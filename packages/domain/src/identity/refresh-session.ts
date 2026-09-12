import type {RefreshFamilyId, RefreshSessionId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Entity} from '../shared-kernel/entity'

import type {RefreshSessionReconstituteProps} from './refresh-session.types'

/**
 * One rotating refresh token in a reusable family. Secrets are stored hashed.
 */
export class RefreshSession extends Entity<RefreshSessionId> {
  readonly userId: UserId

  readonly familyId: RefreshFamilyId

  readonly tokenHash: string

  readonly expiresAt: Date

  #revokedAt: Date | undefined

  private constructor(
    id: RefreshSessionId,
    userId: UserId,
    familyId: RefreshFamilyId,
    tokenHash: string,
    expiresAt: Date,
    revokedAt: Date | undefined,
  ) {
    super(id)
    this.userId = userId
    this.familyId = familyId
    this.tokenHash = tokenHash
    this.expiresAt = expiresAt
    this.#revokedAt = revokedAt
  }

  get revokedAt(): Date | undefined {
    return this.#revokedAt
  }

  static create(
    id: RefreshSessionId,
    userId: UserId,
    familyId: RefreshFamilyId,
    tokenHash: string,
    expiresAt: Date,
  ): RefreshSession {
    return new RefreshSession(id, userId, familyId, tokenHash, expiresAt, undefined)
  }

  static reconstitute(props: RefreshSessionReconstituteProps): RefreshSession {
    return new RefreshSession(props.id, props.userId, props.familyId, props.tokenHash, props.expiresAt, props.revokedAt)
  }

  revoke(at: Date): void {
    this.#revokedAt = at
  }

  isActive(now: Date): boolean {
    return this.#revokedAt === undefined && this.expiresAt.getTime() > now.getTime()
  }
}
