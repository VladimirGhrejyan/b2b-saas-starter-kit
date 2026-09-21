import {describe, expect, it} from 'vitest'

import {DateUtils} from '@b2b-saas-starter-kit/utils'

import {DefaultJobOptions} from './default-job-options'

describe('DefaultJobOptions', () => {
  it('retries with exponential backoff and bounds Redis retention', () => {
    expect(DefaultJobOptions.value).toEqual({
      attempts: 3,
      backoff: {type: 'exponential', delay: DateUtils.secToMs(1)},
      removeOnComplete: {age: DateUtils.hourToSec(1), count: 1000},
      removeOnFail: {age: DateUtils.dayToSec(1)},
    })
  })
})
