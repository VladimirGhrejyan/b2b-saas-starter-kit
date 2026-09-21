import {describe, expect, it} from 'vitest'

import {TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {InvalidObjectKeyError} from './invalid-object-key.error'
import {ObjectKey} from './object-key'

const TENANT = TenantId.parse('33333333-3333-4333-8333-333333333333')
const AT = new Date('2026-09-21T12:00:00.000Z')
const OBJECT_ID = '01996a2e-7c3a-7c3a-8c3a-7c3a7c3a7c3a'

describe('ObjectKey', () => {
  it('prefixes tenant keys with t/{tenantId}/purpose/yyyy/mm/id', () => {
    expect(ObjectKey.tenant(TENANT, 'avatar', OBJECT_ID, AT)).toBe(`t/${TENANT}/avatar/2026/09/${OBJECT_ID}`)
  })

  it('prefixes global keys with g/purpose/yyyy/mm/id', () => {
    expect(ObjectKey.global('export', OBJECT_ID, AT)).toBe(`g/export/2026/09/${OBJECT_ID}`)
  })

  it('parses tenant and global keys', () => {
    const tenantKey = ObjectKey.tenant(TENANT, 'logo', OBJECT_ID, AT)
    const globalKey = ObjectKey.global('export', OBJECT_ID, AT)

    expect(ObjectKey.parse(tenantKey)).toEqual({
      kind: 'tenant',
      tenantId: TENANT,
      purpose: 'logo',
      year: '2026',
      month: '09',
      objectId: OBJECT_ID,
      key: tenantKey,
    })
    expect(ObjectKey.parse(globalKey)).toMatchObject({kind: 'global', purpose: 'export', objectId: OBJECT_ID})
  })

  it('rejects malformed keys', () => {
    const invalid = [
      '',
      'avatar/file',
      `t/${TENANT}/AVATAR/2026/09/${OBJECT_ID}`,
      `t/${TENANT}/../2026/09/${OBJECT_ID}`,
      `t/${TENANT}/avatar/2026/09/${OBJECT_ID}/extra`,
      `t/not-a-uuid/avatar/2026/09/${OBJECT_ID}`,
      `t/${TENANT}/avatar/26/09/${OBJECT_ID}`,
      `t/${TENANT}/avatar/2026/13/${OBJECT_ID}`,
      `t/${TENANT}//2026/09/${OBJECT_ID}`,
    ]

    for (const key of invalid) {
      expect(() => {
        ObjectKey.assert(key)
      }).toThrow(InvalidObjectKeyError)
    }
  })

  it('rejects an invalid date when building a key', () => {
    expect(() => ObjectKey.tenant(TENANT, 'avatar', OBJECT_ID, new Date(Number.NaN))).toThrow(InvalidObjectKeyError)
  })
})
