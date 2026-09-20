import {Inject, Injectable} from '@nestjs/common'

import type {PasswordResetTokenRepository} from '@b2b-saas-starter-kit/domain'
import {PASSWORD_RESET_TOKEN_REPOSITORY} from '@b2b-saas-starter-kit/domain'

import type {Clock, UnitOfWork} from '@b2b-saas-starter-kit/platform'
import {CLOCK, UNIT_OF_WORK} from '@b2b-saas-starter-kit/platform'

import {PURGE_BATCH_SIZE} from '../../shared/purge.constants'

import type {PurgePasswordResetTokensResult} from './purge-password-reset-tokens.types'

/**
 * Deletes expired or consumed password-reset tokens in bounded batches.
 */
@Injectable()
export class PurgePasswordResetTokensUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY) private readonly tokens: PasswordResetTokenRepository,
  ) {}

  async execute(): Promise<PurgePasswordResetTokensResult> {
    const deleted = await this.uow.run(() => this.tokens.deleteInactive(this.clock.now(), PURGE_BATCH_SIZE))

    return {deleted}
  }
}
