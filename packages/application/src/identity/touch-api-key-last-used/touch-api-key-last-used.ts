import {Inject, Injectable} from '@nestjs/common'

import type {ApiKeyId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {ApiKeyRepository} from '@b2b-saas-starter-kit/domain'
import {API_KEY_REPOSITORY} from '@b2b-saas-starter-kit/domain'

import type {Clock} from '@b2b-saas-starter-kit/platform'
import {CLOCK} from '@b2b-saas-starter-kit/platform'

/**
 * Records last-used outside the request {@link UnitOfWork}, with a 60s write-amp guard.
 */
@Injectable()
export class TouchApiKeyLastUsed {
  constructor(
    @Inject(API_KEY_REPOSITORY) private readonly apiKeys: ApiKeyRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  execute(apiKeyId: ApiKeyId): Promise<void> {
    return this.apiKeys.touchLastUsed(apiKeyId, this.clock.now())
  }
}
