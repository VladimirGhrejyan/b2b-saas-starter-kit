import {Module} from '@nestjs/common'

import {CompositionModule} from '@b2b-saas-starter-kit/composition'

import {MembersController} from './members.controller'
import {MembersService} from './members.service'

@Module({
  imports: [CompositionModule],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
