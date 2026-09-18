import {createHash} from 'node:crypto'

/**
 * Canonical SHA-256 fingerprint of a mutating request.
 */
export class IdempotencyFingerprint {
  static hash(method: string, path: string, body: unknown): string {
    return createHash('sha256')
      .update(`${method.toUpperCase()}\n${path}\n${IdempotencyFingerprint.canonicalJson(body)}`)
      .digest('hex')
  }

  private static canonicalJson(body: unknown): string {
    if (body === undefined) {
      return 'null'
    }

    return JSON.stringify(JSON.parse(JSON.stringify(body)))
  }
}
