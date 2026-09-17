import {Injectable} from '@nestjs/common'

import type {IntegrationEvent} from '@b2b-saas-starter-kit/platform'
import {LoggerLocator} from '@b2b-saas-starter-kit/platform'

import {OutboxSerializer} from '@b2b-saas-starter-kit/postgres'

/**
 * MVP outbox handler — structured log only. Replace with audit/mail handlers later.
 */
@Injectable()
export class DomainEventLoggingHandler {
  handle(event: IntegrationEvent): void {
    const tenantId = OutboxSerializer.extractTenantId(event) ?? undefined

    LoggerLocator.get().info({eventType: event.type, tenantId}, 'domain event handled')
  }
}
