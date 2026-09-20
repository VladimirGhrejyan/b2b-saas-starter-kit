import {createHash, timingSafeEqual} from 'node:crypto'

import {Injectable} from '@nestjs/common'

import type {TokenDigest} from '@b2b-saas-starter-kit/platform'

/**
 * SHA-256 hex digest for opaque tokens.
 */
@Injectable()
export class Sha256TokenDigest implements TokenDigest {
  public digest(value: string): string {
    return createHash('sha256').update(value).digest('hex')
  }

  public matches(value: string, digestHex: string): boolean {
    const actual = Buffer.from(this.digest(value), 'hex')
    const expected = Buffer.from(digestHex, 'hex')

    if (actual.length === 0 || actual.length !== expected.length) {
      return false
    }

    return timingSafeEqual(actual, expected)
  }
}
