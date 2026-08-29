import {Module} from '@nestjs/common'

import {
  AuthorizationService,
  CreateTenantUseCase,
  GetMyProfileQuery,
  ListTenantMembersQuery,
} from '@b2b-saas-starter-kit/application'

import {loadPostgresConfigFromEnv, PostgresInfrastructureModule} from '@b2b-saas-starter-kit/postgres'
import {loadRedisConfigFromEnv, RedisInfrastructureModule} from '@b2b-saas-starter-kit/redis'
import {HttpClientModule, loadHttpClientConfigFromEnv} from '@b2b-saas-starter-kit/http-client'

import {AuthorizationModule} from './authorization/authorization.module'
import {IdentityModule} from './identity/identity.module'
import {AssertActiveMembership} from './principal/assert-active-membership'
import {TenancyModule} from './tenancy/tenancy.module'
import {compositionProviders} from './composition.providers'

@Module({
  imports: [
    PostgresInfrastructureModule.forRootAsync({
      useFactory: () => loadPostgresConfigFromEnv(),
    }),
    RedisInfrastructureModule.forRootAsync({
      useFactory: () => loadRedisConfigFromEnv(),
    }),
    HttpClientModule.forRootAsync({
      useFactory: () => loadHttpClientConfigFromEnv(),
    }),
    IdentityModule,
    TenancyModule,
    AuthorizationModule,
  ],
  providers: compositionProviders,
  exports: [
    IdentityModule,
    TenancyModule,
    AuthorizationModule,
    CreateTenantUseCase,
    GetMyProfileQuery,
    ListTenantMembersQuery,
    AuthorizationService,
    AssertActiveMembership,
  ],
})
export class CompositionModule {}
