import {afterAll, beforeAll, describe, expect, it} from 'vitest'

import {HealthCheckStatus} from '@b2b-saas-starter-kit/platform'

import {PostgresTestContext} from '../../testing/postgres-test-context'

import {PostgresHealthIndicator} from './postgres-health.indicator'

describe('PostgresHealthIndicator (compose)', () => {
  let ctx: PostgresTestContext
  let indicator: PostgresHealthIndicator

  beforeAll(async () => {
    ctx = await PostgresTestContext.connect()
    indicator = new PostgresHealthIndicator(ctx.dataSource)
  })

  afterAll(async () => {
    await ctx?.destroy()
  })

  it('reports up against a live database', async () => {
    await expect(indicator.check()).resolves.toEqual({status: HealthCheckStatus.Up})
  })
})
