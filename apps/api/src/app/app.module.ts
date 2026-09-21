import {type DynamicModule, Module} from '@nestjs/common'

import {CompositionModule, RuntimeConfigModule, toCompositionRuntimeConfig} from '@b2b-saas-starter-kit/composition'

import {createHttpProviders, HealthModule, HttpRequestModule} from '@b2b-saas-starter-kit/nest-http'

import {CommonModule} from '../common/common.module'
import {ApiConfigModule} from '../common/config/api-config.module'
import type {ApiConfig} from '../common/config/api-config.schema'
import {codedErrorHttpStatuses} from '../common/http/coded-error-http-statuses'
import {ApiKeysModule} from '../modules/api-keys/api-keys.module'
import {AuthModule} from '../modules/auth/auth.module'
import {InvitationsModule} from '../modules/invitations/invitations.module'
import {MeModule} from '../modules/me/me.module'
import {MembersModule} from '../modules/members/members.module'
import {RolesModule} from '../modules/roles/roles.module'
import {TenantsModule} from '../modules/tenants/tenants.module'
import {UsersModule} from '../modules/users/users.module'

@Module({})
export class AppModule {
  static forRoot(config: ApiConfig): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ApiConfigModule.forRoot(config),
        RuntimeConfigModule.forRoot(
          toCompositionRuntimeConfig({
            postgres: config.postgres,
            redis: config.redis,
            httpClient: config.httpClient,
            mail: config.mail,
          }),
        ),
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
    }
  }
}
