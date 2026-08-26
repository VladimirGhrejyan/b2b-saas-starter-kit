import {Module} from '@nestjs/common'

import {CompositionModule} from '@b2b-saas-starter-kit/composition'

import {TenantsController} from './tenants.controller'
import {TenantsService} from './tenants.service'

@Module({
  imports: [CompositionModule],
  controllers: [TenantsController],
  providers: [TenantsService],
})
export class TenantsModule {}
