import {randomUUID} from 'node:crypto'

import {Injectable} from '@nestjs/common'
import {type EntityManager, QueryFailedError} from 'typeorm'

import type {
  IdempotencyClaim,
  IdempotencyClaimInput,
  IdempotencyCompleteInput,
  IdempotencyPort,
} from '@b2b-saas-starter-kit/platform'
import {IdempotencyClaimKind} from '@b2b-saas-starter-kit/platform'

import {transactionAls} from '../persistence/transaction-als'

import {IdempotencyKeyEntity} from './idempotency-key.entity'
import {IdempotencyOutsideTransactionError} from './idempotency-outside-transaction.error'
import {IdempotencyRecordStatus} from './idempotency-record-status'
import {
  IDEMPOTENCY_CLAIM_INSERT_SQL,
  IDEMPOTENCY_LOCK_TIMEOUT,
  IDEMPOTENCY_UUID_PATTERN,
} from './idempotency-sql.constants'

/**
 * Postgres store for {@link IdempotencyPort}. Rows commit with the ambient UnitOfWork.
 */
@Injectable()
export class PostgresIdempotencyStore implements IdempotencyPort {
  async claim(input: IdempotencyClaimInput): Promise<IdempotencyClaim> {
    const manager = this.requireAmbientManager()

    await manager.query(`SET LOCAL lock_timeout = '2s'`)

    try {
      const inserted: unknown = await manager.query(IDEMPOTENCY_CLAIM_INSERT_SQL, [
        randomUUID(),
        input.scope,
        input.endpoint,
        input.key,
        input.fingerprint,
        IdempotencyRecordStatus.parse('processing'),
        input.expiresAt,
        this.uuidFromScope(input.scope, 't:'),
        this.uuidFromScope(input.scope, 'u:'),
        new Date(),
      ])

      if (Array.isArray(inserted) && inserted.length > 0) {
        return {kind: IdempotencyClaimKind.Acquired}
      }

      return await this.existingClaim(manager, input)
    } catch (error) {
      if (this.isSqlState(error, IDEMPOTENCY_LOCK_TIMEOUT)) {
        return {kind: IdempotencyClaimKind.InFlight}
      }

      throw error
    }
  }

  async complete(input: IdempotencyCompleteInput): Promise<void> {
    const manager = this.requireAmbientManager()
    const existing = await this.find(manager, input)

    if (existing === null) {
      throw new Error('Idempotency complete() has no matching claim row')
    }

    existing.status = IdempotencyRecordStatus.parse('completed')
    existing.responseStatus = input.statusCode
    existing.responseBody = input.body ?? null

    await manager.getRepository(IdempotencyKeyEntity).save(existing)
  }

  private async existingClaim(manager: EntityManager, input: IdempotencyClaimInput): Promise<IdempotencyClaim> {
    const existing = await this.find(manager, input)

    if (existing === null) {
      return {kind: IdempotencyClaimKind.InFlight}
    }

    if (existing.requestFingerprint !== input.fingerprint) {
      return {kind: IdempotencyClaimKind.FingerprintMismatch}
    }

    if (existing.status === 'processing') {
      return {kind: IdempotencyClaimKind.InFlight}
    }

    if (existing.responseStatus === null) {
      return {kind: IdempotencyClaimKind.InFlight}
    }

    return {
      kind: IdempotencyClaimKind.Replay,
      statusCode: existing.responseStatus,
      body: existing.responseBody,
    }
  }

  private find(
    manager: EntityManager,
    input: Pick<IdempotencyClaimInput, 'scope' | 'endpoint' | 'key'>,
  ): Promise<IdempotencyKeyEntity | null> {
    return manager.getRepository(IdempotencyKeyEntity).findOneBy({
      scope: input.scope,
      endpoint: input.endpoint,
      idempotencyKey: input.key,
    })
  }

  private requireAmbientManager(): EntityManager {
    const store = transactionAls.getStore()

    if (store === undefined) {
      throw new IdempotencyOutsideTransactionError()
    }

    return store.manager
  }

  private uuidFromScope(scope: string, prefix: string): string | null {
    if (!scope.startsWith(prefix)) {
      return null
    }

    const value = scope.slice(prefix.length)

    return IDEMPOTENCY_UUID_PATTERN.test(value) ? value : null
  }

  private isSqlState(error: unknown, code: string): boolean {
    if (error instanceof QueryFailedError && this.driverCode(error.driverError) === code) {
      return true
    }

    return this.driverCode(error) === code
  }

  private driverCode(error: unknown): string | undefined {
    if (typeof error !== 'object' || error === null || !('code' in error) || typeof error.code !== 'string') {
      return undefined
    }

    return error.code
  }
}
