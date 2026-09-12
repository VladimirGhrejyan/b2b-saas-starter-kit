import {createHash} from 'node:crypto'

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
}
