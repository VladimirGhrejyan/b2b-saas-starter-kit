import {Module} from '@nestjs/common'

import {CompositionModule} from '@b2b-saas-starter-kit/composition'

import {createHttpProviders, HttpRequestModule} from '@b2b-saas-starter-kit/nest-http'

import {CommonModule} from '../common/common.module'
import {codedErrorHttpStatuses} from '../common/http/coded-error-http-statuses'
import {MeModule} from '../modules/me/me.module'
import {MembersModule} from '../modules/members/members.module'
import {TenantsModule} from '../modules/tenants/tenants.module'
import {UsersModule} from '../modules/users/users.module'

@Module({
  imports: [HttpRequestModule, CompositionModule, CommonModule, UsersModule, TenantsModule, MembersModule, MeModule],
  providers: [...createHttpProviders({codedErrorHttpStatuses})],
})
export class AppModule {}
