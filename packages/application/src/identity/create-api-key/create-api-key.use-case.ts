import {Inject, Injectable} from '@nestjs/common'

import {ApiKeyId, TenantActorKind} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {ApiKeyRepository} from '@b2b-saas-starter-kit/domain'
import {API_KEY_REPOSITORY, ApiKey, PermissionCatalog} from '@b2b-saas-starter-kit/domain'

import type {Clock, EventPublisher, IdGenerator, TokenDigest, UnitOfWork} from '@b2b-saas-starter-kit/platform'
import {CLOCK, EVENT_PUBLISHER, ID_GENERATOR, TOKEN_DIGEST, UNIT_OF_WORK} from '@b2b-saas-starter-kit/platform'

import type {AuthorizationPort} from '../../shared/authorization.port'
import {AUTHORIZATION} from '../../shared/authorization.port'
import {DomainEventCollector} from '../../shared/domain-events/domain-event-collector'
import {InsufficientPermissionError} from '../../shared/errors/insufficient-permission.error'
import {ApiKeyToken} from '../api-key-token'

import type {CreateApiKeyCommand, CreateApiKeyResult} from './create-api-key.types'

/**
 * Mints a tenant API key. The raw token is returned once.
 */
@Injectable()
export class CreateApiKeyUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
    @Inject(TOKEN_DIGEST) private readonly digest: TokenDigest,
    @Inject(AUTHORIZATION) private readonly authz: AuthorizationPort,
    @Inject(API_KEY_REPOSITORY) private readonly apiKeys: ApiKeyRepository,
    @Inject(EVENT_PUBLISHER) private readonly events: EventPublisher,
  ) {}

  async execute(command: CreateApiKeyCommand): Promise<CreateApiKeyResult> {
    const actor = command.actor

    await this.authz.require(actor, PermissionCatalog.identityApiKeysManage, {tenantId: command.tenantId})

    if (actor.kind !== TenantActorKind.user) {
      throw new InsufficientPermissionError(PermissionCatalog.identityApiKeysManage)
    }

    const creatorPermissions = await this.authz.getEffectivePermissions(actor.id, command.tenantId)

    for (const permission of command.permissions) {
      PermissionCatalog.assertKnown(permission)

      if (!creatorPermissions.includes(permission)) {
        throw new InsufficientPermissionError(permission)
      }
    }

    return this.uow.run(async () => {
      const collector = new DomainEventCollector()
      const now = this.clock.now()
      const publicPrefix = ApiKeyToken.compactId(this.ids.generate())
      const secret = this.ids.generate().replaceAll('-', '')
      const token = ApiKeyToken.create(publicPrefix, secret)
      const apiKey = ApiKey.create(
        ApiKeyId.parse(this.ids.generate()),
        command.tenantId,
        actor.id,
        command.name,
        ApiKeyToken.displayPrefix(publicPrefix),
        this.digest.digest(token),
        command.permissions,
        now,
        command.expiresAt,
      )

      await this.apiKeys.save(apiKey)
      collector.collect(apiKey)
      await collector.publish(this.events)

      return {apiKeyId: apiKey.id, token}
    })
  }
}
