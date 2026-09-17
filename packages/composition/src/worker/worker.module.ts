import {Module} from '@nestjs/common'

import {loadPostgresConfigFromEnv, PostgresInfrastructureModule} from '@b2b-saas-starter-kit/postgres'

import {DomainEventLoggingHandler} from './domain-event-logging.handler'
import {OutboxRelayService} from './outbox-relay.service'

@Module({
  imports: [
    PostgresInfrastructureModule.forRootAsync({
      useFactory: () => loadPostgresConfigFromEnv(),
    }),
  ],
  providers: [DomainEventLoggingHandler, OutboxRelayService],
  exports: [OutboxRelayService],
})
export class WorkerModule {}
