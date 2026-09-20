import {Inject, Injectable} from '@nestjs/common'

import type {ApiKeyId, Permission} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {ApiKeyRepository} from '@b2b-saas-starter-kit/domain'
import {API_KEY_REPOSITORY} from '@b2b-saas-starter-kit/domain'

import type {Clock} from '@b2b-saas-starter-kit/platform'
import {CLOCK} from '@b2b-saas-starter-kit/platform'

import type {ApiKeyPermissionsPort} from '../shared/api-key-permissions.port'

/**
 * Active API-key permissions for {@link AuthorizationPort}.
 */
@Injectable()
export class ApiKeyPermissionsService implements ApiKeyPermissionsPort {
  constructor(
    @Inject(API_KEY_REPOSITORY) private readonly apiKeys: ApiKeyRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async permissionsFor(apiKeyId: ApiKeyId): Promise<readonly Permission[]> {
    const apiKey = await this.apiKeys.findById(apiKeyId)

    if (apiKey === null || !apiKey.isUsable(this.clock.now())) {
      return []
    }

    return apiKey.permissions
  }
}
