import {describe, expect, it, vi} from 'vitest'

import {HealthCheckStatus} from '@b2b-saas-starter-kit/platform'

import {RedisHealthIndicator} from './redis-health.indicator'

describe('RedisHealthIndicator', () => {
  it('returns up when PING succeeds', async () => {
    const redis = {ping: vi.fn().mockResolvedValue('PONG')}
    const indicator = new RedisHealthIndicator(redis as never)

    await expect(indicator.check()).resolves.toEqual({status: HealthCheckStatus.Up})
    expect(redis.ping).toHaveBeenCalledOnce()
  })

  it('returns down when PING throws', async () => {
    const redis = {ping: vi.fn().mockRejectedValue(new Error('ECONNREFUSED redis://secret'))}
    const indicator = new RedisHealthIndicator(redis as never)

    await expect(indicator.check()).resolves.toEqual({status: HealthCheckStatus.Down, message: 'unreachable'})
  })
})
