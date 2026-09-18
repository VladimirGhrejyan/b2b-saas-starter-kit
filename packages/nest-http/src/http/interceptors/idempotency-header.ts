import type {IncomingHttpHeaders} from 'node:http'

import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

/**
 * Reads and validates the `Idempotency-Key` header.
 */
export class IdempotencyHeader {
  static readonly name = 'idempotency-key'

  static readonly maxLength = 255

  static readonly ttlHours = 24

  static read(headers: IncomingHttpHeaders): string | undefined {
    const value = headers[IdempotencyHeader.name]

    if (TypeScriptUtils.isNonEmptyString(value)) {
      return value
    }

    if (Array.isArray(value) && TypeScriptUtils.isNonEmptyString(value[0])) {
      return value[0]
    }

    return undefined
  }

  static isValid(key: string): boolean {
    if (key.length > IdempotencyHeader.maxLength) {
      return false
    }

    for (const character of key) {
      const code = character.charCodeAt(0)

      if (code < 32 || code === 127) {
        return false
      }
    }

    return true
  }
}
