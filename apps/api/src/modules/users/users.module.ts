import {Module} from '@nestjs/common'

import {CompositionModule} from '@b2b-saas-starter-kit/composition'

import {UsersController} from './users.controller'
import {UsersService} from './users.service'

@Module({
  imports: [CompositionModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
