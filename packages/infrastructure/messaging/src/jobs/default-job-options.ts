import type {DefaultJobOptions as BullMqDefaultJobOptions} from 'bullmq'

import {DateUtils} from '@b2b-saas-starter-kit/utils'

/**
 * Shared BullMQ job options: retries, bounded completion history, bounded failed retention.
 */
export class DefaultJobOptions {
  static readonly value: BullMqDefaultJobOptions = {
    attempts: 3,
    backoff: {type: 'exponential', delay: DateUtils.secToMs(1)},
    removeOnComplete: {age: DateUtils.hourToSec(1), count: 1000},
    removeOnFail: {age: DateUtils.dayToSec(1)},
  }
}
