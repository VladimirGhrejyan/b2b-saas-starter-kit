import {applyDecorators, SetMetadata} from '@nestjs/common'
import {ApiHeader} from '@nestjs/swagger'

import {IDEMPOTENT_KEY} from './idempotent-key'

/**
 * Requires `Idempotency-Key` and records the response for safe retries.
 */
export function Idempotent() {
  return applyDecorators(
    SetMetadata(IDEMPOTENT_KEY, true),
    ApiHeader({
      name: 'Idempotency-Key',
      required: true,
      description: 'Client-generated key so a retried mutation replays the original response',
    }),
  )
}
