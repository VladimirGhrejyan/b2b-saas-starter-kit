import {Global, Module} from '@nestjs/common'

import {CLOCK, ID_GENERATOR} from '@b2b-saas-starter-kit/platform'

import {SystemClock} from './clock/clock'
import {UuidV7IdGenerator} from './id-generator/id-generator'

/**
 * Nest wrapper around process clock and UUID v7 id generation.
 */
@Global()
@Module({
  providers: [
    SystemClock,
    {
      provide: CLOCK,
      useExisting: SystemClock,
    },
    UuidV7IdGenerator,
    {
      provide: ID_GENERATOR,
      useExisting: UuidV7IdGenerator,
    },
  ],
  exports: [SystemClock, CLOCK, UuidV7IdGenerator, ID_GENERATOR],
})
export class NodeInfrastructureModule {}
