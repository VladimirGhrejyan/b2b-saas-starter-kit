import type {ApiKeyId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {ApiKey, ApiKeyRepository} from '@b2b-saas-starter-kit/domain'

import {API_KEY_LAST_USED_TOUCH_MS} from './api-key.constants'
import type {InMemorySnapshotable} from './in-memory-snapshotable'

/**
 * In-memory {@link ApiKeyRepository} for application unit tests.
 */
export class InMemoryApiKeyRepository implements ApiKeyRepository, InMemorySnapshotable {
  #keys = new Map<ApiKeyId, ApiKey>()

  findById(id: ApiKeyId): Promise<ApiKey | null> {
    return Promise.resolve(this.#keys.get(id) ?? null)
  }

  findByPrefix(prefix: string): Promise<ApiKey | null> {
    for (const apiKey of this.#keys.values()) {
      if (apiKey.prefix === prefix) {
        return Promise.resolve(apiKey)
      }
    }

    return Promise.resolve(null)
  }

  findByTenant(tenantId: TenantId): Promise<readonly ApiKey[]> {
    return Promise.resolve([...this.#keys.values()].filter((apiKey) => apiKey.tenantId === tenantId))
  }

  save(apiKey: ApiKey): Promise<void> {
    this.#keys.set(apiKey.id, apiKey)

    return Promise.resolve()
  }

  async touchLastUsed(id: ApiKeyId, at: Date): Promise<void> {
    const apiKey = await this.findById(id)

    if (apiKey === null) {
      return
    }

    if (apiKey.lastUsedAt !== undefined && at.getTime() - apiKey.lastUsedAt.getTime() < API_KEY_LAST_USED_TOUCH_MS) {
      return
    }

    apiKey.recordLastUsed(at)
    await this.save(apiKey)
  }

  snapshot(): unknown {
    return new Map(this.#keys)
  }

  restore(snapshot: unknown): void {
    this.#keys = new Map(snapshot as Map<ApiKeyId, ApiKey>)
  }
}
