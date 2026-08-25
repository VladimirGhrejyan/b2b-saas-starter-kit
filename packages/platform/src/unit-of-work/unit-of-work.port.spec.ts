import {describe, expect, it} from 'vitest'

import type {UnitOfWork} from './unit-of-work.port'

describe('UnitOfWork', () => {
  it('accepts an in-memory-shaped fake', async () => {
    const uow: UnitOfWork = {
      run: async (work) => work({id: 'tx-1'}),
    }

    await expect(uow.run(async (ctx) => ctx.id)).resolves.toBe('tx-1')
  })
})
