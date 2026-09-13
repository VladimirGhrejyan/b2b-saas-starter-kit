import {Injectable} from '@nestjs/common'

import type {RefreshSessionRepository} from '@b2b-saas-starter-kit/domain'

import type {Clock, TokenDigest, UnitOfWork} from '@b2b-saas-starter-kit/platform'

import type {LogoutCommand} from './logout.types'

/**
 * Revokes the refresh family when a cookie is present. Always succeeds.
 */
@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly digest: TokenDigest,
    private readonly sessions: RefreshSessionRepository,
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
