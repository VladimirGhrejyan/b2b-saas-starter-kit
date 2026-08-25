import {describe, expect, it} from 'vitest'

import {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {Clock} from './clock.port'
import type {IdGenerator} from './id-generator.port'
import type {TenantContext, TenantScope} from './tenant-context.port'
import {TenantContextNotEstablishedError} from './tenant-context-not-established.error'
import type {UnitOfWork} from './unit-of-work.port'

const tenantId = TenantId.parse('11111111-1111-4111-8111-111111111111')
const actorId = UserId.parse('22222222-2222-4222-8222-222222222222')

const scope: TenantScope = {tenantId, actorId}

describe('platform ports', () => {
  it('accepts in-memory-shaped fakes for Clock, IdGenerator, and UnitOfWork', async () => {
    const clock: Clock = {
      now: () => new Date('2026-01-01T00:00:00.000Z'),
    }

    const ids: IdGenerator = {
      generate: () => '33333333-3333-4333-8333-333333333333',
    }

    const uow: UnitOfWork = {
      run: async (work) => work({id: 'tx-1'}),
    }

    expect(clock.now().toISOString()).toBe('2026-01-01T00:00:00.000Z')
    expect(ids.generate()).toBe('33333333-3333-4333-8333-333333333333')
    await expect(uow.run(async (ctx) => ctx.id)).resolves.toBe('tx-1')
  })

  it('accepts an established TenantContext fake', async () => {
    const tenantContext: TenantContext = {
      run: async (_scope, work) => work(),
      withoutTenantScope: async (work) => work(),
      getTenantId: () => tenantId,
      getActorId: () => actorId,
    }

    expect(tenantContext.getTenantId()).toBe(tenantId)
    expect(tenantContext.getActorId()).toBe(actorId)
    await expect(tenantContext.run(scope, async () => 'ok')).resolves.toBe('ok')
  })

  it('is an Error with a stable code', () => {
    const error = new TenantContextNotEstablishedError()

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(TenantContextNotEstablishedError)
    expect(error.code).toBe('TENANT_CONTEXT_NOT_ESTABLISHED')
    expect(error.message).toBe('TenantContext is not established')
    expect(error.name).toBe('TenantContextNotEstablishedError')
  })

  it('is catchable from fail-closed TenantContext getters', () => {
    const unsetContext: TenantContext = {
      run: async (_scope, work) => work(),
      withoutTenantScope: async (work) => work(),
      getTenantId: () => {
        throw new TenantContextNotEstablishedError()
      },
      getActorId: () => {
        throw new TenantContextNotEstablishedError()
      },
    }

    expect(() => {
      unsetContext.getTenantId()
    }).toThrow(TenantContextNotEstablishedError)
    expect(() => {
      unsetContext.getActorId()
    }).toThrow(TenantContextNotEstablishedError)
  })
})
