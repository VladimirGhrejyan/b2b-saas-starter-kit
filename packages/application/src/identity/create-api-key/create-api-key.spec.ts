import {describe, expect, it} from 'vitest'

import {Permission, TenantId, userActor, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {PermissionCatalog} from '@b2b-saas-starter-kit/domain'

import type {AuthorizationPort} from '../../shared/authorization.port'
import {InsufficientPermissionError} from '../../shared/errors/insufficient-permission.error'
import {FixedClock} from '../../testing/fixed-clock'
import {InMemoryApiKeyRepository} from '../../testing/in-memory-api-key.repository'
import {InMemoryTokenDigest} from '../../testing/in-memory-token-digest'
import {InMemoryUnitOfWork} from '../../testing/in-memory-unit-of-work'
import {RecordingEventPublisher} from '../../testing/recording-event-publisher'
import {SequentialIdGenerator} from '../../testing/sequential-id-generator'
import {ApiKeyToken} from '../api-key-token'

import {CreateApiKeyUseCase} from './create-api-key.use-case'

const OCCURRED_AT = new Date('2026-01-01T00:00:00.000Z')
const OWNER_ID = UserId.parse('11111111-1111-4111-8111-111111111111')
const TENANT_ID = TenantId.parse('33333333-3333-4333-8333-333333333333')
const READ = Permission.parse('tenancy.tenant.read')

function authzWith(permissions: readonly ReturnType<typeof Permission.parse>[]): AuthorizationPort {
  return {
    async require() {
      return undefined
    },
    async getPermissions() {
      return permissions
    },
    async getEffectivePermissions() {
      return permissions
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

describe('CreateApiKeyUseCase', () => {
  it('returns a bsk_ token once and stores only the hash', async () => {
    const apiKeys = new InMemoryApiKeyRepository()
    const digest = new InMemoryTokenDigest()
    const create = new CreateApiKeyUseCase(
      new InMemoryUnitOfWork(apiKeys),
      new FixedClock(OCCURRED_AT),
      new SequentialIdGenerator(),
      digest,
      authzWith([READ, PermissionCatalog.identityApiKeysManage]),
      apiKeys,
      new RecordingEventPublisher(),
    )

    const result = await create.execute({
      actor: userActor(OWNER_ID),
      tenantId: TENANT_ID,
      name: 'CI',
      permissions: [READ],
    })

    expect(ApiKeyToken.isApiKeyToken(result.token)).toBe(true)
    const stored = await apiKeys.findById(result.apiKeyId)

    expect(stored?.secretHash).toBe(digest.digest(result.token))
    expect(stored?.secretHash).not.toBe(result.token)
  })

  it('rejects minting a permission the creator lacks', async () => {
    const apiKeys = new InMemoryApiKeyRepository()
    const create = new CreateApiKeyUseCase(
      new InMemoryUnitOfWork(apiKeys),
      new FixedClock(OCCURRED_AT),
      new SequentialIdGenerator(),
      new InMemoryTokenDigest(),
      authzWith([PermissionCatalog.identityApiKeysManage]),
      apiKeys,
      new RecordingEventPublisher(),
    )

    await expect(
      create.execute({
        actor: userActor(OWNER_ID),
        tenantId: TENANT_ID,
        name: 'CI',
        permissions: [READ],
      }),
    ).rejects.toBeInstanceOf(InsufficientPermissionError)
  })
})
