import {describe, expect, it, vi} from 'vitest'

import type {EventBus} from '@b2b-saas-starter-kit/platform'

import {DomainEventLoggingHandler} from './domain-event-logging.handler'
import {DomainEventSubscriptionRegistrar} from './domain-event-subscription.registrar'

describe('DomainEventSubscriptionRegistrar', () => {
  it('registers the logging handler as a catch-all once', () => {
    const eventBus = {
      register: vi.fn(),
      registerAll: vi.fn(),
      dispatch: vi.fn(),
    } satisfies EventBus

    const registrar = new DomainEventSubscriptionRegistrar(new DomainEventLoggingHandler(), eventBus)

    registrar.onModuleInit()

    expect(eventBus.registerAll).toHaveBeenCalledOnce()
    expect(eventBus.register).not.toHaveBeenCalled()
  })
})
