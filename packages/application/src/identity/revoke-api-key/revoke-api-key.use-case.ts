import {Inject, Injectable} from '@nestjs/common'

import type {ApiKeyRepository} from '@b2b-saas-starter-kit/domain'
import {API_KEY_REPOSITORY, PermissionCatalog} from '@b2b-saas-starter-kit/domain'

import type {Clock, EventPublisher, UnitOfWork} from '@b2b-saas-starter-kit/platform'
import {CLOCK, EVENT_PUBLISHER, UNIT_OF_WORK} from '@b2b-saas-starter-kit/platform'

import type {AuthorizationPort} from '../../shared/authorization.port'
import {AUTHORIZATION} from '../../shared/authorization.port'
import {DomainEventCollector} from '../../shared/domain-events/domain-event-collector'
import {ApiKeyNotFoundError} from '../../shared/errors/api-key-not-found.error'

import type {RevokeApiKeyCommand} from './revoke-api-key.types'

/**
 * Revokes a tenant API key.
 */
@Injectable()
export class RevokeApiKeyUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AUTHORIZATION) private readonly authz: AuthorizationPort,
    @Inject(API_KEY_REPOSITORY) private readonly apiKeys: ApiKeyRepository,
    @Inject(EVENT_PUBLISHER) private readonly events: EventPublisher,
  ) {}

  async execute(command: RevokeApiKeyCommand): Promise<void> {
    await this.authz.require(command.actor, PermissionCatalog.identityApiKeysManage, {tenantId: command.tenantId})

    await this.uow.run(async () => {
      const collector = new DomainEventCollector()
      const apiKey = await this.apiKeys.findById(command.apiKeyId)

      if (apiKey === null || apiKey.tenantId !== command.tenantId) {
        throw new ApiKeyNotFoundError()
      }

      apiKey.revoke(this.clock.now())
      await this.apiKeys.save(apiKey)
      collector.collect(apiKey)
      await collector.publish(this.events)
      await this.authz.invalidateApiKey(apiKey.id, command.tenantId)
    })
  }
}
