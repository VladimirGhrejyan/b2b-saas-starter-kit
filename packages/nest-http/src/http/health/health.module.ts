import {Module} from '@nestjs/common'

import {HealthAggregator} from './health.aggregator'
import {HealthController} from './health.controller'

@Module({
  controllers: [HealthController],
  providers: [HealthAggregator],
})
export class HealthModule {}
