import {Module} from '@nestjs/common'

import {CompositionModule} from '@b2b-saas-starter-kit/composition'

import {createHttpProviders} from '@b2b-saas-starter-kit/nest-http'

import {CommonModule} from '../common/common.module'
import {MeModule} from '../modules/me/me.module'
import {MembersModule} from '../modules/members/members.module'
import {TenantsModule} from '../modules/tenants/tenants.module'
import {UsersModule} from '../modules/users/users.module'

@Module({
  imports: [CompositionModule, CommonModule, UsersModule, TenantsModule, MembersModule, MeModule],
  providers: [...createHttpProviders()],
})
export class AppModule {}
