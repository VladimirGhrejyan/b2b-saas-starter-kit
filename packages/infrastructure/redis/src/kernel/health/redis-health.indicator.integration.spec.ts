import {afterAll, beforeAll, describe, expect, it} from 'vitest'

import {HealthCheckStatus} from '@b2b-saas-starter-kit/platform'

import {RedisTestContext} from '../testing/redis-test-context'

import {RedisHealthIndicator} from './redis-health.indicator'

describe('RedisHealthIndicator (compose)', () => {
  let ctx: RedisTestContext
  let indicator: RedisHealthIndicator

  beforeAll(async () => {
    ctx = await RedisTestContext.connect()
    indicator = new RedisHealthIndicator(ctx.client)
  })

  afterAll(async () => {
    await ctx?.destroy()
  })

  it('reports up against a live Redis', async () => {
    await expect(indicator.check()).resolves.toEqual({status: HealthCheckStatus.Up})
  })
})
