import {Inject, Injectable} from '@nestjs/common'

import type {RefreshSessionRepository} from '@b2b-saas-starter-kit/domain'
import {REFRESH_SESSION_REPOSITORY} from '@b2b-saas-starter-kit/domain'

import type {Clock, UnitOfWork} from '@b2b-saas-starter-kit/platform'
import {CLOCK, UNIT_OF_WORK} from '@b2b-saas-starter-kit/platform'

import {PURGE_BATCH_SIZE} from '../../shared/purge.constants'

import type {PurgeRefreshSessionsResult} from './purge-refresh-sessions.types'

/**
 * Deletes expired or revoked refresh sessions in bounded batches.
 */
@Injectable()
export class PurgeRefreshSessionsUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(REFRESH_SESSION_REPOSITORY) private readonly sessions: RefreshSessionRepository,
  ) {}

  async execute(): Promise<PurgeRefreshSessionsResult> {
    const deleted = await this.uow.run(() => this.sessions.deleteExpiredOrRevoked(this.clock.now(), PURGE_BATCH_SIZE))

    return {deleted}
  }
}
