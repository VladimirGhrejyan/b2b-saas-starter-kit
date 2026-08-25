import {Injectable} from '@nestjs/common'

import type {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {TenantContext, TenantScope} from '@b2b-saas-starter-kit/platform'
import {TenantContextNotEstablishedError} from '@b2b-saas-starter-kit/platform'

import {tenantAls} from './tenant-als'

/**
 * Node {@link AsyncLocalStorage} {@link TenantContext}. Concurrent `run` scopes do not leak.
 */
@Injectable()
export class AlsTenantContext implements TenantContext {
  run<T>(scope: TenantScope, work: () => Promise<T>): Promise<T> {
    return tenantAls.run({scope, skipTenantScope: false}, work)
  }

  withoutTenantScope<T>(work: () => Promise<T>): Promise<T> {
    const store = tenantAls.getStore()

    return tenantAls.run({scope: store?.scope, skipTenantScope: true}, work)
  }

  getTenantId(): TenantId {
    return this.#requireScope().tenantId
  }

  getActorId(): UserId {
    return this.#requireScope().actorId
  }

  #requireScope(): TenantScope {
    const store = tenantAls.getStore()

    if (store === undefined || store.scope === undefined) {
      throw new TenantContextNotEstablishedError()
    }

    return store.scope
  }
}
