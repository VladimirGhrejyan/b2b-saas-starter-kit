import {Inject, Injectable} from '@nestjs/common'

import type {ApiKeyRepository} from '@b2b-saas-starter-kit/domain'
import {API_KEY_REPOSITORY} from '@b2b-saas-starter-kit/domain'

import type {Clock, TokenDigest} from '@b2b-saas-starter-kit/platform'
import {CLOCK, TOKEN_DIGEST} from '@b2b-saas-starter-kit/platform'

import {ApiKeyToken} from '../api-key-token'

import type {ResolveApiKeyResult} from './resolve-api-key.types'

/**
 * Resolves a Bearer `bsk_` token to an active API key.
 */
@Injectable()
export class ResolveApiKeyQuery {
  constructor(
    @Inject(API_KEY_REPOSITORY) private readonly apiKeys: ApiKeyRepository,
    @Inject(TOKEN_DIGEST) private readonly digest: TokenDigest,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(token: string): Promise<ResolveApiKeyResult | null> {
    const parsed = ApiKeyToken.parse(token)

    if (parsed === undefined) {
      return null
    }

    const apiKey = await this.apiKeys.findByPrefix(parsed.prefix)

    if (apiKey === null || !apiKey.isUsable(this.clock.now()) || !this.digest.matches(token, apiKey.secretHash)) {
      return null
    }

    return {apiKeyId: apiKey.id, tenantId: apiKey.tenantId}
  }
}
