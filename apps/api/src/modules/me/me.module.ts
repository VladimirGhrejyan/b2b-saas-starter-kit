import {Module} from '@nestjs/common'

import {CompositionModule} from '@b2b-saas-starter-kit/composition'

import {MeController} from './me.controller'
import {MeService} from './me.service'

@Module({
  imports: [CompositionModule],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
