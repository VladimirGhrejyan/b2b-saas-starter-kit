import {describe, expect, it, vi} from 'vitest'

import {HealthCheckStatus} from '@b2b-saas-starter-kit/platform'

import {PostgresHealthIndicator} from './postgres-health.indicator'

describe('PostgresHealthIndicator', () => {
  it('returns up when SELECT 1 succeeds', async () => {
    const dataSource = {query: vi.fn().mockResolvedValue([{'?column?': 1}])}
    const indicator = new PostgresHealthIndicator(dataSource as never)

    await expect(indicator.check()).resolves.toEqual({status: HealthCheckStatus.Up})
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1')
  })

  it('returns down when SELECT 1 throws', async () => {
    const dataSource = {query: vi.fn().mockRejectedValue(new Error('ECONNREFUSED postgres://secret'))}
    const indicator = new PostgresHealthIndicator(dataSource as never)

    await expect(indicator.check()).resolves.toEqual({status: HealthCheckStatus.Down, message: 'unreachable'})
  })
})
