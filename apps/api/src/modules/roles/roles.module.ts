import {Module} from '@nestjs/common'

import {CompositionModule} from '@b2b-saas-starter-kit/composition'

import {RolesController} from './roles.controller'
import {RolesService} from './roles.service'

@Module({
  imports: [CompositionModule],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
