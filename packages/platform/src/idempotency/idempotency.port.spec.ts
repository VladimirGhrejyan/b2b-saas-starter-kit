import {describe, expect, it} from 'vitest'

import type {IdempotencyPort} from './idempotency.port'
import {IdempotencyClaimKind} from './idempotency.types'

describe('IdempotencyPort', () => {
  it('accepts an in-memory-shaped fake', async () => {
    const store: IdempotencyPort = {
      claim: async () => ({kind: IdempotencyClaimKind.Acquired}),
      complete: async () => undefined,
    }

    await expect(
      store.claim({
        scope: 'u:actor',
        endpoint: 'POST /tenants',
        key: 'key-1',
        fingerprint: 'fp',
        expiresAt: new Date('2026-01-02T00:00:00.000Z'),
      }),
    ).resolves.toEqual({kind: IdempotencyClaimKind.Acquired})

    await expect(
      store.complete({
        scope: 'u:actor',
        endpoint: 'POST /tenants',
        key: 'key-1',
        statusCode: 201,
        body: {id: 't1'},
      }),
    ).resolves.toBeUndefined()
  })
})
