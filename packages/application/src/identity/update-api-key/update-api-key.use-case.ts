import {Inject, Injectable} from '@nestjs/common'

import {TenantActorKind} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {ApiKeyRepository} from '@b2b-saas-starter-kit/domain'
import {API_KEY_REPOSITORY, PermissionCatalog} from '@b2b-saas-starter-kit/domain'

import type {Clock, EventPublisher, UnitOfWork} from '@b2b-saas-starter-kit/platform'
import {CLOCK, EVENT_PUBLISHER, UNIT_OF_WORK} from '@b2b-saas-starter-kit/platform'

import type {AuthorizationPort} from '../../shared/authorization.port'
import {AUTHORIZATION} from '../../shared/authorization.port'
import {DomainEventCollector} from '../../shared/domain-events/domain-event-collector'
import {ApiKeyNotFoundError} from '../../shared/errors/api-key-not-found.error'
import {InsufficientPermissionError} from '../../shared/errors/insufficient-permission.error'

import type {UpdateApiKeyCommand, UpdateApiKeyResult} from './update-api-key.types'

/**
 * Updates an API key name and/or minted permissions.
 */
@Injectable()
export class UpdateApiKeyUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AUTHORIZATION) private readonly authz: AuthorizationPort,
    @Inject(API_KEY_REPOSITORY) private readonly apiKeys: ApiKeyRepository,
    @Inject(EVENT_PUBLISHER) private readonly events: EventPublisher,
  ) {}

  async execute(command: UpdateApiKeyCommand): Promise<UpdateApiKeyResult> {
    await this.authz.require(command.actor, PermissionCatalog.identityApiKeysManage, {tenantId: command.tenantId})

    if (command.permissions !== undefined && command.actor.kind === TenantActorKind.user) {
      const creatorPermissions = await this.authz.getEffectivePermissions(command.actor.id, command.tenantId)

      for (const permission of command.permissions) {
        PermissionCatalog.assertKnown(permission)

        if (!creatorPermissions.includes(permission)) {
          throw new InsufficientPermissionError(permission)
        }
      }
    }

    return this.uow.run(async () => {
      const collector = new DomainEventCollector()
      const apiKey = await this.apiKeys.findById(command.apiKeyId)

      if (apiKey === null || apiKey.tenantId !== command.tenantId) {
        throw new ApiKeyNotFoundError()
      }

      if (command.name !== undefined) {
        apiKey.rename(command.name)
      }

      if (command.permissions !== undefined) {
        apiKey.replacePermissions(command.permissions, this.clock.now())
      }

      await this.apiKeys.save(apiKey)
      collector.collect(apiKey)
      await collector.publish(this.events)
      await this.authz.invalidateApiKey(apiKey.id, command.tenantId)

      return {
        apiKeyId: apiKey.id,
        name: apiKey.name,
        prefix: apiKey.prefix,
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
        revokedAt: apiKey.revokedAt,
        lastUsedAt: apiKey.lastUsedAt,
      }
    })
  }
}
