import {describe, expect, it} from 'vitest'

import {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {InvalidTenantNameError} from './errors/invalid-tenant-name.error'
import {TenantAlreadyActiveError} from './errors/tenant-already-active.error'
import {TenantAlreadySuspendedError} from './errors/tenant-already-suspended.error'
import {Tenant} from './tenant'

const TENANT_ID = TenantId.parse('33333333-3333-4333-8333-333333333333')
const OTHER_ID = TenantId.parse('44444444-4444-4444-8444-444444444444')
const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')

describe('Tenant', () => {
  it('create records TenantCreated and starts active', () => {
    const tenant = Tenant.create(TENANT_ID, '  Acme  ', OCCURRED_AT)

    expect(tenant.name).toBe('Acme')
    expect(tenant.status).toBe('active')
    expect(tenant.pullEvents()).toEqual([
      {
        type: 'TenantCreated',
        occurredAt: OCCURRED_AT,
        tenantId: TENANT_ID,
        name: 'Acme',
      },
    ])
    expect(tenant.pullEvents()).toEqual([])
  })

  it('renames and rejects a blank name', () => {
    const tenant = Tenant.create(TENANT_ID, 'Acme', OCCURRED_AT)

    tenant.pullEvents()
    tenant.rename('  Globex  ', OCCURRED_AT)

    expect(tenant.name).toBe('Globex')
    expect(tenant.pullEvents()[0]).toMatchObject({type: 'TenantRenamed', name: 'Globex'})
    expect(() => {
      tenant.rename('   ', OCCURRED_AT)
    }).toThrow(InvalidTenantNameError)
  })

  it('suspends and activates, and rejects already-in-state', () => {
    const tenant = Tenant.create(TENANT_ID, 'Acme', OCCURRED_AT)

    tenant.pullEvents()
    tenant.suspend(OCCURRED_AT)

    expect(tenant.status).toBe('suspended')
    expect(tenant.pullEvents()[0]).toMatchObject({type: 'TenantSuspended', tenantId: TENANT_ID})
    expect(() => {
      tenant.suspend(OCCURRED_AT)
    }).toThrow(TenantAlreadySuspendedError)

    tenant.activate(OCCURRED_AT)

    expect(tenant.status).toBe('active')
    expect(tenant.pullEvents()[0]).toMatchObject({type: 'TenantActivated', tenantId: TENANT_ID})
    expect(() => {
      tenant.activate(OCCURRED_AT)
    }).toThrow(TenantAlreadyActiveError)
  })

  it('reconstitute does not record events', () => {
    const tenant = Tenant.reconstitute({
      id: TENANT_ID,
      name: 'Acme',
      status: 'suspended',
    })

    expect(tenant.status).toBe('suspended')
    expect(tenant.pullEvents()).toEqual([])
  })

  it('equals another Tenant with the same id', () => {
    const left = Tenant.reconstitute({id: TENANT_ID, name: 'Acme', status: 'active'})
    const right = Tenant.reconstitute({id: TENANT_ID, name: 'Other', status: 'suspended'})
    const other = Tenant.reconstitute({id: OTHER_ID, name: 'Acme', status: 'active'})

    expect(left.equals(right)).toBe(true)
    expect(left.equals(other)).toBe(false)
  })
})
