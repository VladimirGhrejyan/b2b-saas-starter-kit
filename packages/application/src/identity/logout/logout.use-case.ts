import {Inject, Injectable} from '@nestjs/common'

import type {RefreshSessionRepository} from '@b2b-saas-starter-kit/domain'
import {REFRESH_SESSION_REPOSITORY} from '@b2b-saas-starter-kit/domain'

import type {Clock, TokenDigest, UnitOfWork} from '@b2b-saas-starter-kit/platform'
import {CLOCK, TOKEN_DIGEST, UNIT_OF_WORK} from '@b2b-saas-starter-kit/platform'

import type {LogoutCommand} from './logout.types'

/**
 * Revokes the refresh family when a cookie is present. Always succeeds.
 */
@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(TOKEN_DIGEST) private readonly digest: TokenDigest,
    @Inject(REFRESH_SESSION_REPOSITORY) private readonly sessions: RefreshSessionRepository,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    if (command.refreshToken === undefined || command.refreshToken === '') {
      return
    }

    await this.uow.run(async () => {
      const session = await this.sessions.findByTokenHash(this.digest.digest(command.refreshToken ?? ''))

      if (session === null) {
        return
      }

      await this.sessions.revokeFamily(session.familyId, this.clock.now())
    })
  }
}
