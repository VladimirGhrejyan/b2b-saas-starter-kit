import type {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {TenantContext, TenantScope} from '@b2b-saas-starter-kit/platform'
import {TenantContextNotEstablishedError} from '@b2b-saas-starter-kit/platform'

/**
 * In-memory {@link TenantContext} with a nestable scope stack. Unused by Phase 6 use cases.
 */
export class InMemoryTenantContext implements TenantContext {
  readonly #stack: TenantScope[] = []

  async run<T>(scope: TenantScope, work: () => Promise<T>): Promise<T> {
    this.#stack.push(scope)

    try {
      return await work()
    } finally {
      this.#stack.pop()
    }
  }

  async withoutTenantScope<T>(work: () => Promise<T>): Promise<T> {
    return work()
  }

  getTenantId(): TenantId {
    return this.#requireScope().tenantId
  }

  getActorId(): UserId {
    return this.#requireScope().actorId
  }

  #requireScope(): TenantScope {
    const scope = this.#stack.at(-1)

    if (scope === undefined) {
      throw new TenantContextNotEstablishedError()
    }

    return scope
  }
}
