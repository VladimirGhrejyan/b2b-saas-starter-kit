import {Inject, Injectable} from '@nestjs/common'

import type {ApiKeyRepository} from '@b2b-saas-starter-kit/domain'
import {API_KEY_REPOSITORY, PermissionCatalog} from '@b2b-saas-starter-kit/domain'

import type {AuthorizationPort} from '../../shared/authorization.port'
import {AUTHORIZATION} from '../../shared/authorization.port'

import type {ListApiKeysQueryInput, ListApiKeysResult} from './list-api-keys.types'

/**
 * Lists tenant API keys without hashes or raw tokens.
 */
@Injectable()
export class ListApiKeysQuery {
  constructor(
    @Inject(AUTHORIZATION) private readonly authz: AuthorizationPort,
    @Inject(API_KEY_REPOSITORY) private readonly apiKeys: ApiKeyRepository,
  ) {}

  async execute(query: ListApiKeysQueryInput): Promise<ListApiKeysResult> {
    await this.authz.require(query.actor, PermissionCatalog.identityApiKeysManage, {tenantId: query.tenantId})

    const apiKeys = await this.apiKeys.findByTenant(query.tenantId)

    return {
      apiKeys: apiKeys.map((apiKey) => ({
        apiKeyId: apiKey.id,
        name: apiKey.name,
        prefix: apiKey.prefix,
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
        revokedAt: apiKey.revokedAt,
        lastUsedAt: apiKey.lastUsedAt,
      })),
    }
  }
}
