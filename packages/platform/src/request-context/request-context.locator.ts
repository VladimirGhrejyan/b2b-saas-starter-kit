import type {RequestContext} from './request-context.types'
import {requestContextAls} from './request-context-als'

/**
 * Request-scoped correlation store. Not a Nest provider.
 *
 * `run` establishes the scope. `get` returns `undefined` outside a scope.
 * `bind` mutates the current store (no-op when unset) so later listeners still
 * see tenant/actor on the same object.
 */
export class RequestContextLocator {
  static run<T>(context: RequestContext, work: () => Promise<T>): Promise<T> {
    return requestContextAls.run(context, work)
  }

  static get(): RequestContext | undefined {
    return requestContextAls.getStore()
  }

  static bind(patch: Pick<RequestContext, 'tenantId' | 'actorId'>): void {
    const store = requestContextAls.getStore()

    if (store === undefined) {
      return
    }

    if (patch.tenantId !== undefined) {
      store.tenantId = patch.tenantId
    }

    if (patch.actorId !== undefined) {
      store.actorId = patch.actorId
    }
  }
}
