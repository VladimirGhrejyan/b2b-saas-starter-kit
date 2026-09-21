import {Inject, Injectable, type OnModuleInit} from '@nestjs/common'

import type {EventBus} from '@b2b-saas-starter-kit/platform'
import {EVENT_BUS} from '@b2b-saas-starter-kit/platform'

import {DomainEventLoggingHandler} from './domain-event-logging.handler'

/**
 * Registers catch-all EventBus handlers for outbox-delivered domain events.
 */
@Injectable()
export class DomainEventSubscriptionRegistrar implements OnModuleInit {
  constructor(
    private readonly loggingHandler: DomainEventLoggingHandler,
    @Inject(EVENT_BUS) private readonly eventBus: EventBus,
  ) {}

  onModuleInit(): void {
    this.eventBus.registerAll((event) => {
      this.loggingHandler.handle(event)

      return Promise.resolve()
    })
  }
}
