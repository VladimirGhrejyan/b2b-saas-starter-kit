import {ObjectUtils, TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

import type {DomainEvent} from '@b2b-saas-starter-kit/domain'

import type {IntegrationEvent} from '@b2b-saas-starter-kit/platform'

import type {SerializedDomainEvent} from './outbox.serializer.types'

/**
 * Serializes and deserializes domain events for outbox JSONB storage.
 */
export class OutboxSerializer {
  static serialize(event: IntegrationEvent): SerializedDomainEvent {
    const payload = {...event, occurredAt: event.occurredAt.toISOString()} as SerializedDomainEvent

    return payload
  }

  static deserialize(payload: Record<string, unknown>): DomainEvent {
    const type = payload.type

    if (!TypeScriptUtils.isString(type)) {
      throw new Error('Outbox payload is missing event type')
    }

    const occurredAtRaw = payload.occurredAt

    if (!TypeScriptUtils.isString(occurredAtRaw)) {
      throw new Error('Outbox payload is missing occurredAt')
    }

    return {
      ...payload,
      type,
      occurredAt: new Date(occurredAtRaw),
    } as DomainEvent
  }

  static extractTenantId(event: IntegrationEvent): string | null {
    if (ObjectUtils.hasOwn(event, 'tenantId') && TypeScriptUtils.isString(event.tenantId)) {
      return event.tenantId
    }

    return null
  }
}
