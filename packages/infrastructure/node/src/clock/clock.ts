import {Injectable} from '@nestjs/common'

import type {Clock} from '@b2b-saas-starter-kit/platform'

/**
 * System clock. `now()` is a UTC instant (`Date` epoch, no local timezone conversion).
 */
@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date()
  }
}
