import {randomUUID} from 'node:crypto'

import {Injectable} from '@nestjs/common'
import type {EntityManager} from 'typeorm'

import type {EventPublisher, IntegrationEvent} from '@b2b-saas-starter-kit/platform'

import {transactionAls} from '../persistence/transaction-als'

import {EventPublisherOutsideTransactionError} from './event-publisher-outside-transaction.error'
import {OutboxSerializer} from './outbox.serializer'
import {OutboxEntryEntity} from './outbox-entry.entity'
import {OutboxStatus} from './outbox-status'

/**
 * Writes outbox rows in the ambient TypeORM transaction.
 */
@Injectable()
export class PostgresEventPublisher implements EventPublisher {
  async publish(events: readonly IntegrationEvent[]): Promise<void> {
    if (events.length === 0) {
      return
    }

    const manager = this.#requireAmbientManager()
    const now = new Date()
    const rows = events.map((event) => {
      const entity = new OutboxEntryEntity()

      entity.id = randomUUID()
      entity.eventType = event.type
      entity.payload = OutboxSerializer.serialize(event)
      entity.tenantId = OutboxSerializer.extractTenantId(event)
      entity.status = OutboxStatus.parse('pending')
      entity.createdAt = now
      entity.processedAt = null
      entity.attemptCount = 0

      return entity
    })

    await manager.getRepository(OutboxEntryEntity).save(rows)
  }

  #requireAmbientManager(): EntityManager {
    const store = transactionAls.getStore()

    if (store === undefined) {
      throw new EventPublisherOutsideTransactionError()
    }

    return store.manager
  }
}
