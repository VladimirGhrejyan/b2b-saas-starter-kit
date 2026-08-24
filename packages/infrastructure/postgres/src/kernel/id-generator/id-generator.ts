import {Injectable} from '@nestjs/common'
import {v7 as uuidv7} from 'uuid'

import type {IdGenerator} from '@b2b-saas-starter-kit/platform'

/**
 * UUID v7 generator. Application brands the raw string (`UserId.parse(...)`).
 */
@Injectable()
export class UuidV7IdGenerator implements IdGenerator {
  generate(): string {
    return uuidv7()
  }
}
