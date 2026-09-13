import {SetMetadata} from '@nestjs/common'

import type {RateLimitOptions} from './rate-limit.types'
import {RATE_LIMIT_KEY} from './rate-limit-key'

export function RateLimit(options: RateLimitOptions) {
  return SetMetadata(RATE_LIMIT_KEY, options)
}
