import {describe, expect, it} from 'vitest'

import {TenantId, userActor, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Tenant} from '@b2b-saas-starter-kit/domain'

import type {AuthorizationPort} from '../../shared/authorization.port'
import {InsufficientPermissionError} from '../../shared/errors/insufficient-permission.error'
import {InMemoryTenantRepository} from '../../testing/in-memory-tenant.repository'
import {TenantNotFoundError} from '../errors/tenant-not-found.error'

import {GetTenantQuery} from './get-tenant.query'

const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')
const ACTOR_ID = UserId.parse('11111111-1111-4111-8111-111111111111')
const TENANT_ID = TenantId.parse('33333333-3333-4333-8333-333333333333')

function allowingAuthz(): AuthorizationPort {
  return {
    async require() {
      return undefined
    },
    async getEffectivePermissions() {
      return []
    },
    async invalidate() {
      return undefined
    },
    async getPermissions() {
      return []
    },
    async invalidateHoldersOf() {
      return undefined
    },
    async invalidateApiKey() {
      return undefined
    },
  }
}

function denyingAuthz(): AuthorizationPort {
  return {
    async require(_actor, permission) {
      throw new InsufficientPermissionError(permission)
    },
    async getEffectivePermissions() {
      return []
    },
    async getPermissions() {
      return []
    },
    async invalidate() {
      return undefined
    },
    async invalidateHoldersOf() {
      return undefined
    },
    async invalidateApiKey() {
      return undefined
    },
  }
}

describe('GetTenantQuery', () => {
  it('returns id and name after authorization succeeds', async () => {
    const tenants = new InMemoryTenantRepository()

    await tenants.save(Tenant.create(TENANT_ID, 'Acme', OCCURRED_AT))

    const result = await new GetTenantQuery(allowingAuthz(), tenants).execute({
      tenantId: TENANT_ID,
      actor: userActor(ACTOR_ID),
    })

    expect(result).toEqual({id: TENANT_ID, name: 'Acme'})
  })

  it('throws when the tenant is missing', async () => {
    await expect(
      new GetTenantQuery(allowingAuthz(), new InMemoryTenantRepository()).execute({
        tenantId: TENANT_ID,
        actor: userActor(ACTOR_ID),
      }),
    ).rejects.toBeInstanceOf(TenantNotFoundError)
  })

  it('does not load the tenant when authorization denies', async () => {
    const tenants = new InMemoryTenantRepository()

    await tenants.save(Tenant.create(TENANT_ID, 'Acme', OCCURRED_AT))

    await expect(
      new GetTenantQuery(denyingAuthz(), tenants).execute({tenantId: TENANT_ID, actor: userActor(ACTOR_ID)}),
    ).rejects.toBeInstanceOf(InsufficientPermissionError)
  })
})
