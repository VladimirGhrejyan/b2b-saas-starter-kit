import {describe, expect, it} from 'vitest'

import {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {TenantContextNotEstablishedError} from '@b2b-saas-starter-kit/platform'

import {AlsTenantContext} from './tenant-context'

const tenantA = TenantId.parse('11111111-1111-4111-8111-111111111111')
const tenantB = TenantId.parse('22222222-2222-4222-8222-222222222222')
const actorA = UserId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const actorB = UserId.parse('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')

describe('AlsTenantContext', () => {
  it('throws TenantContextNotEstablishedError when no scope is active', () => {
    const tenantContext = new AlsTenantContext()

    expect(() => {
      tenantContext.getTenantId()
    }).toThrow(TenantContextNotEstablishedError)
    expect(() => {
      tenantContext.getActorId()
    }).toThrow(TenantContextNotEstablishedError)
  })

  it('exposes the scope established by run', async () => {
    const tenantContext = new AlsTenantContext()

    await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => {
      expect(tenantContext.getTenantId()).toBe(tenantA)
      expect(tenantContext.getActorId()).toBe(actorA)
    })
  })

  it('does not leak concurrent run scopes on the same singleton', async () => {
    const tenantContext = new AlsTenantContext()
    const seen: string[] = []

    await Promise.all([
      tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => {
        await delay(30)
        seen.push(tenantContext.getTenantId())
      }),
      tenantContext.run({tenantId: tenantB, actorId: actorB}, async () => {
        seen.push(tenantContext.getTenantId())
      }),
    ])

    expect(seen).toEqual([tenantB, tenantA])
  })

  it('restores the outer scope after a nested run', async () => {
    const tenantContext = new AlsTenantContext()

    await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => {
      await tenantContext.run({tenantId: tenantB, actorId: actorB}, async () => {
        expect(tenantContext.getTenantId()).toBe(tenantB)
      })

      expect(tenantContext.getTenantId()).toBe(tenantA)
    })
  })
})

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
