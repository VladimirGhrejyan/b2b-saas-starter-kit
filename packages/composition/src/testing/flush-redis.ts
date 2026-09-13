import type {INestApplicationContext} from '@nestjs/common'

import {REDIS_CLIENT} from '@b2b-saas-starter-kit/redis'

/**
 * FLUSHDB on the process Redis. Isolates rate-limit keys between HTTP e2e cases.
 */
export async function flushRedis(app: INestApplicationContext): Promise<void> {
  const client = app.get<{flushdb: () => Promise<unknown>}>(REDIS_CLIENT)

  await client.flushdb()
}
