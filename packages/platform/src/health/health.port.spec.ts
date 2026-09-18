import {describe, expect, it} from 'vitest'

import type {HealthIndicator} from './health.port'
import {HealthCheckStatus} from './health.types'

describe('HealthIndicator', () => {
  it('accepts an in-memory-shaped fake', async () => {
    const indicator: HealthIndicator = {
      name: 'postgres',
      check: async () => ({status: HealthCheckStatus.Up}),
    }

    await expect(indicator.check()).resolves.toEqual({status: HealthCheckStatus.Up})
  })
})
