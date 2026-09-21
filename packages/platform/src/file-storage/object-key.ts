import {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {ParsedObjectKey} from './file-storage.types'
import {InvalidObjectKeyError} from './invalid-object-key.error'

/**
 * Builds S3-safe object keys. Tenant keys are prefixed `t/{tenantId}/` so objects
 * cannot leak across tenants. Bucket is a port argument, not part of the key.
 */
export class ObjectKey {
  static readonly #SEGMENT_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/

  static readonly #YEAR_PATTERN = /^\d{4}$/

  static readonly #MONTH_PATTERN = /^(0[1-9]|1[0-2])$/

  static tenant(tenantId: TenantId, purpose: string, objectId: string, at: Date): string {
    const {year, month} = ObjectKey.#utcYearMonth(at)
    const key = `t/${tenantId}/${purpose}/${year}/${month}/${objectId}`

    return ObjectKey.parse(key).key
  }

  static global(purpose: string, objectId: string, at: Date): string {
    const {year, month} = ObjectKey.#utcYearMonth(at)
    const key = `g/${purpose}/${year}/${month}/${objectId}`

    return ObjectKey.parse(key).key
  }

  static parse(key: string): ParsedObjectKey {
    const parts = key.split('/')

    if (parts.includes('') || parts.includes('.') || parts.includes('..')) {
      throw new InvalidObjectKeyError(key)
    }

    if (parts[0] === 't' && parts.length === 6) {
      return ObjectKey.#parseTenant(key, parts)
    }

    if (parts[0] === 'g' && parts.length === 5) {
      return ObjectKey.#parseGlobal(key, parts)
    }

    throw new InvalidObjectKeyError(key)
  }

  static assert(key: string): void {
    ObjectKey.parse(key)
  }

  static #parseTenant(key: string, parts: string[]): ParsedObjectKey {
    const [, rawTenantId, purpose, year, month, objectId] = parts

    ObjectKey.#assertSegment(purpose, key)
    ObjectKey.#assertSegment(objectId, key)
    ObjectKey.#assertYearMonth(year, month, key)

    try {
      return {
        kind: 'tenant',
        tenantId: TenantId.parse(rawTenantId),
        purpose,
        year,
        month,
        objectId,
        key,
      }
    } catch {
      throw new InvalidObjectKeyError(key)
    }
  }

  static #parseGlobal(key: string, parts: string[]): ParsedObjectKey {
    const [, purpose, year, month, objectId] = parts

    ObjectKey.#assertSegment(purpose, key)
    ObjectKey.#assertSegment(objectId, key)
    ObjectKey.#assertYearMonth(year, month, key)

    return {
      kind: 'global',
      purpose,
      year,
      month,
      objectId,
      key,
    }
  }

  static #utcYearMonth(at: Date): {readonly year: string; readonly month: string} {
    if (Number.isNaN(at.getTime())) {
      throw new InvalidObjectKeyError('(invalid date)')
    }

    return {
      year: String(at.getUTCFullYear()),
      month: String(at.getUTCMonth() + 1).padStart(2, '0'),
    }
  }

  static #assertSegment(value: string, key: string): void {
    if (!ObjectKey.#SEGMENT_PATTERN.test(value)) {
      throw new InvalidObjectKeyError(key)
    }
  }

  static #assertYearMonth(year: string, month: string, key: string): void {
    if (!ObjectKey.#YEAR_PATTERN.test(year) || !ObjectKey.#MONTH_PATTERN.test(month)) {
      throw new InvalidObjectKeyError(key)
    }
  }
}
