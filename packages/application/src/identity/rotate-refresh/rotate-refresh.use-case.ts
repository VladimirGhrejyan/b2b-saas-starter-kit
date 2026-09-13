import {Injectable} from '@nestjs/common'

import {RefreshSessionId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {RefreshSessionRepository} from '@b2b-saas-starter-kit/domain'
import {RefreshSession} from '@b2b-saas-starter-kit/domain'

import type {Clock, IdGenerator, TokenDigest, UnitOfWork} from '@b2b-saas-starter-kit/platform'

import {REFRESH_TTL_MS} from '../authentication.constants'
import {InvalidRefreshTokenError} from '../errors/invalid-refresh-token.error'

import type {RotateRefreshCommand, RotateRefreshResult} from './rotate-refresh.types'

/**
 * Rotates a refresh token. Reuse of a revoked token revokes the whole family.
 */
@Injectable()
export class RotateRefreshUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly digest: TokenDigest,
    private readonly sessions: RefreshSessionRepository,
  ) {}

  async execute(command: RotateRefreshCommand): Promise<RotateRefreshResult> {
    const outcome = await this.uow.run(async (): Promise<RotateRefreshResult | 'reuse'> => {
      const now = this.clock.now()
      const session = await this.sessions.findByTokenHash(this.digest.digest(command.refreshToken))

      if (session === null) {
        throw new InvalidRefreshTokenError()
      }

      if (session.revokedAt !== undefined) {
        await this.sessions.revokeFamily(session.familyId, now)

        return 'reuse'
      }

      if (!session.isActive(now)) {
        throw new InvalidRefreshTokenError()
      }

      session.revoke(now)
      await this.sessions.save(session)

      const refreshToken = this.ids.generate()
      const next = RefreshSession.create(
        RefreshSessionId.parse(this.ids.generate()),
        session.userId,
        session.familyId,
        this.digest.digest(refreshToken),
        new Date(now.getTime() + REFRESH_TTL_MS),
      )

      await this.sessions.save(next)

      return {userId: session.userId, refreshToken}
    })

    if (outcome === 'reuse') {
      throw new InvalidRefreshTokenError()
    }

    return outcome
  }
}
