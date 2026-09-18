import {describe, expect, it} from 'vitest'

import type {HealthIndicator} from '@b2b-saas-starter-kit/platform'
import {HealthCheckStatus} from '@b2b-saas-starter-kit/platform'

import {HealthAggregator} from './health.aggregator'

describe('HealthAggregator', () => {
  it('returns ok without checks for liveness', () => {
    const aggregator = new HealthAggregator()

    expect(aggregator.live()).toEqual({status: 'ok'})
  })

  it('returns ok with no checks when no indicators are registered', async () => {
    const aggregator = new HealthAggregator()

    await expect(aggregator.ready()).resolves.toEqual({status: 'ok', checks: {}})
  })

  it('returns ok when every indicator is up', async () => {
    const aggregator = new HealthAggregator([up('postgres'), up('redis')])

    await expect(aggregator.ready()).resolves.toEqual({
      status: 'ok',
      checks: {
        postgres: {status: HealthCheckStatus.Up},
        redis: {status: HealthCheckStatus.Up},
      },
    })
  })

  it('returns error when any indicator is down', async () => {
    const aggregator = new HealthAggregator([
      up('postgres'),
      {name: 'redis', check: async () => ({status: HealthCheckStatus.Down, message: 'unreachable'})},
    ])

    await expect(aggregator.ready()).resolves.toEqual({
      status: 'error',
      checks: {
        postgres: {status: HealthCheckStatus.Up},
        redis: {status: HealthCheckStatus.Down, message: 'unreachable'},
      },
    })
  })

  it('maps a throwing indicator to down', async () => {
    const aggregator = new HealthAggregator([
      {
        name: 'redis',
        check: async () => {
          throw new Error('ECONNREFUSED redis://secret')
        },
      },
    ])

    await expect(aggregator.ready()).resolves.toEqual({
      status: 'error',
      checks: {
        redis: {status: HealthCheckStatus.Down, message: 'unreachable'},
      },
    })
  })
})

function up(name: string): HealthIndicator {
  return {name, check: async () => ({status: HealthCheckStatus.Up})}
}
