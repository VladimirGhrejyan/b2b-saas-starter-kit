import {Module} from '@nestjs/common'

import {CompositionModule} from '@b2b-saas-starter-kit/composition'

import {ApiKeysController} from './api-keys.controller'
import {ApiKeysService} from './api-keys.service'

@Module({
  imports: [CompositionModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
})
export class ApiKeysModule {}
