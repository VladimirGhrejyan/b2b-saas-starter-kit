import {Module} from '@nestjs/common'

import {CompositionModule} from '@b2b-saas-starter-kit/composition'

import {createHttpProviders, HealthModule, HttpRequestModule} from '@b2b-saas-starter-kit/nest-http'

import {CommonModule} from '../common/common.module'
import {codedErrorHttpStatuses} from '../common/http/coded-error-http-statuses'
import {ApiKeysModule} from '../modules/api-keys/api-keys.module'
import {AuthModule} from '../modules/auth/auth.module'
import {InvitationsModule} from '../modules/invitations/invitations.module'
import {MeModule} from '../modules/me/me.module'
import {MembersModule} from '../modules/members/members.module'
import {RolesModule} from '../modules/roles/roles.module'
import {TenantsModule} from '../modules/tenants/tenants.module'
import {UsersModule} from '../modules/users/users.module'

@Module({
  imports: [
    HttpRequestModule,
    CompositionModule,
    HealthModule,
    CommonModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    MembersModule,
    InvitationsModule,
    RolesModule,
    ApiKeysModule,
    MeModule,
  ],
  providers: [...createHttpProviders({codedErrorHttpStatuses})],
})
export class AppModule {}
