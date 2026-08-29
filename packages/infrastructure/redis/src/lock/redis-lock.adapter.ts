import {randomUUID} from 'node:crypto'

import {Inject, Injectable} from '@nestjs/common'
import type Redis from 'ioredis'

import type {LockLease, LockPort} from '@b2b-saas-starter-kit/platform'

import {REDIS_CLIENT} from '../kernel/tokens'

@Injectable()
export class RedisLock implements LockPort {
  private static readonly releaseScript = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async acquire(key: string, ttlSeconds: number): Promise<LockLease | null> {
    const token = randomUUID()
    const result = await this.redis.set(key, token, 'EX', ttlSeconds, 'NX')

    if (result !== 'OK') {
      return null
    }

    return {key, token}
  }

  async release(lease: LockLease): Promise<void> {
    await this.redis.eval(RedisLock.releaseScript, 1, lease.key, lease.token)
  }
}
