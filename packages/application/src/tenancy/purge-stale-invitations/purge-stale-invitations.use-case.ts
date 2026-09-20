import {Inject, Injectable} from '@nestjs/common'

import type {InvitationRepository} from '@b2b-saas-starter-kit/domain'
import {INVITATION_REPOSITORY} from '@b2b-saas-starter-kit/domain'

import type {Clock, UnitOfWork} from '@b2b-saas-starter-kit/platform'
import {CLOCK, UNIT_OF_WORK} from '@b2b-saas-starter-kit/platform'

import {PURGE_BATCH_SIZE} from '../../shared/purge.constants'

import type {PurgeStaleInvitationsResult} from './purge-stale-invitations.types'

/**
 * Deletes consumed or expired invitations in bounded batches.
 */
@Injectable()
export class PurgeStaleInvitationsUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(INVITATION_REPOSITORY) private readonly invitations: InvitationRepository,
  ) {}

  async execute(): Promise<PurgeStaleInvitationsResult> {
    const deleted = await this.uow.run(() => this.invitations.deleteStale(this.clock.now(), PURGE_BATCH_SIZE))

    return {deleted}
  }
}
