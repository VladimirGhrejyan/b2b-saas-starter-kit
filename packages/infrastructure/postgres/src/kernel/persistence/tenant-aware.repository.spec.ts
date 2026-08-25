import type {DataSource} from 'typeorm'
import {describe, expect, it} from 'vitest'

import {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {TenantContextNotEstablishedError} from '@b2b-saas-starter-kit/platform'

import {AlsTenantContext} from '../tenant-context/tenant-context'
import {TenantContextMismatchError} from '../tenant-context/tenant-context-mismatch.error'

import {TenantAwareRepository} from './tenant-aware.repository'

const tenantA = TenantId.parse('11111111-1111-4111-8111-111111111111')
const tenantB = TenantId.parse('22222222-2222-4222-8222-222222222222')
const actorA = UserId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')

class StampProbeRepository extends TenantAwareRepository {
  stamp(row: {tenantId?: string}): {tenantId: string} {
    return this.stampTenantId(row)
  }
}

describe('TenantAwareRepository.stampTenantId', () => {
  const tenantContext = new AlsTenantContext()
  const repo = new StampProbeRepository({} as DataSource, tenantContext)

  it('throws TenantContextNotEstablishedError when no scope is active', () => {
    expect(() => {
      repo.stamp({tenantId: tenantA})
    }).toThrow(TenantContextNotEstablishedError)
  })

  it('stamps the ambient tenant when a run scope is active', async () => {
    await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => {
      expect(repo.stamp({})).toEqual({tenantId: tenantA})
    })
  })

  it('throws TenantContextMismatchError when the row disagrees with ambient', async () => {
    await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () => {
      expect(() => {
        repo.stamp({tenantId: tenantB})
      }).toThrow(TenantContextMismatchError)
    })
  })

  it('persists row.tenantId inside withoutTenantScope', async () => {
    await tenantContext.withoutTenantScope(async () => {
      expect(repo.stamp({tenantId: tenantB})).toEqual({tenantId: tenantB})
    })
  })
})
