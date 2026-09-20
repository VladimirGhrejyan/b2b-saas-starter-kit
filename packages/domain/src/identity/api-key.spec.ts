import {describe, expect, it} from 'vitest'

import {ApiKeyId, Permission, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {ApiKeyAlreadyRevokedError} from './errors/api-key-already-revoked.error'
import {ApiKeyCannotManageKeysError} from './errors/api-key-cannot-manage-keys.error'
import {EmptyApiKeyPermissionsError} from './errors/empty-api-key-permissions.error'
import {InvalidApiKeyNameError} from './errors/invalid-api-key-name.error'
import {ApiKey} from './api-key'

const API_KEY_ID = ApiKeyId.parse('11111111-1111-4111-8111-111111111111')
const TENANT_ID = TenantId.parse('22222222-2222-4222-8222-222222222222')
const USER_ID = UserId.parse('33333333-3333-4333-8333-333333333333')
const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')
const READ = Permission.parse('tenancy.tenant.read')
const INVITE = Permission.parse('tenancy.members.invite')

function createKey(permissions: readonly Permission[] = [READ]): ApiKey {
  return ApiKey.create(API_KEY_ID, TENANT_ID, USER_ID, '  CI  ', 'bsk_abcdefghijkl', 'hash', permissions, OCCURRED_AT)
}

describe('ApiKey', () => {
  it('create records ApiKeyCreated, trims the name, and stores the permission subset', () => {
    const apiKey = createKey([READ, INVITE])

    expect(apiKey.name).toBe('CI')
    expect(apiKey.permissions).toEqual([READ, INVITE])
    expect(apiKey.revokedAt).toBeUndefined()
    expect(apiKey.isUsable(OCCURRED_AT)).toBe(true)
    expect(apiKey.pullEvents()).toEqual([
      {
        type: 'ApiKeyCreated',
        occurredAt: OCCURRED_AT,
        apiKeyId: API_KEY_ID,
        tenantId: TENANT_ID,
        createdByUserId: USER_ID,
        prefix: 'bsk_abcdefghijkl',
      },
    ])
    expect(apiKey.pullEvents()).toEqual([])
  })

  it('rejects a blank name, empty permissions, and identity.api_keys.manage', () => {
    expect(() => {
      createKey([])
    }).toThrow(EmptyApiKeyPermissionsError)
    expect(() => {
      ApiKey.create(API_KEY_ID, TENANT_ID, USER_ID, '   ', 'bsk_abcdefghijkl', 'hash', [READ], OCCURRED_AT)
    }).toThrow(InvalidApiKeyNameError)
    expect(() => {
      createKey([READ, Permission.parse('identity.api_keys.manage')])
    }).toThrow(ApiKeyCannotManageKeysError)
  })

  it('revoke records ApiKeyRevoked and is not usable', () => {
    const apiKey = createKey()

    apiKey.pullEvents()
    apiKey.revoke(OCCURRED_AT)

    expect(apiKey.revokedAt).toEqual(OCCURRED_AT)
    expect(apiKey.isUsable(OCCURRED_AT)).toBe(false)
    expect(apiKey.pullEvents()[0]).toMatchObject({type: 'ApiKeyRevoked', apiKeyId: API_KEY_ID})
    expect(() => {
      apiKey.revoke(OCCURRED_AT)
    }).toThrow(ApiKeyAlreadyRevokedError)
  })

  it('is not usable after expiry', () => {
    const apiKey = ApiKey.create(
      API_KEY_ID,
      TENANT_ID,
      USER_ID,
      'CI',
      'bsk_abcdefghijkl',
      'hash',
      [READ],
      OCCURRED_AT,
      OCCURRED_AT,
    )

    expect(apiKey.isUsable(OCCURRED_AT)).toBe(false)
    expect(apiKey.isUsable(new Date(OCCURRED_AT.getTime() - 1))).toBe(true)
  })

  it('replacePermissions records the event and rejects manage', () => {
    const apiKey = createKey()

    apiKey.pullEvents()
    apiKey.replacePermissions([INVITE], OCCURRED_AT)

    expect(apiKey.permissions).toEqual([INVITE])
    expect(apiKey.pullEvents()[0]).toMatchObject({type: 'ApiKeyPermissionsReplaced'})
    expect(() => {
      apiKey.replacePermissions([Permission.parse('identity.api_keys.manage')], OCCURRED_AT)
    }).toThrow(ApiKeyCannotManageKeysError)
  })

  it('reconstitute does not record events', () => {
    const apiKey = ApiKey.reconstitute({
      id: API_KEY_ID,
      tenantId: TENANT_ID,
      createdByUserId: USER_ID,
      name: 'CI',
      prefix: 'bsk_abcdefghijkl',
      secretHash: 'hash',
      permissions: [READ],
      revokedAt: OCCURRED_AT,
    })

    expect(apiKey.revokedAt).toEqual(OCCURRED_AT)
    expect(apiKey.pullEvents()).toEqual([])
  })
})
