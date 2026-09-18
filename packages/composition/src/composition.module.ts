import {Module} from '@nestjs/common'

import {
  AcceptInvitationUseCase,
  AttachMemberUseCase,
  AUTHORIZATION,
  AuthorizationService,
  CreateCustomRoleUseCase,
  CreateTenantUseCase,
  DeleteCustomRoleUseCase,
  GetMyProfileQuery,
  GetTenantQuery,
  InviteMemberUseCase,
  ListRolesQuery,
  ListTenantMembersQuery,
  LoginUseCase,
  ReplaceMembershipRolesUseCase,
  SelectTenantUseCase,
  UpdateCustomRoleUseCase,
} from '@b2b-saas-starter-kit/application'

import {loadPostgresConfigFromEnv, PostgresInfrastructureModule} from '@b2b-saas-starter-kit/postgres'
import {loadRedisConfigFromEnv, RedisInfrastructureModule} from '@b2b-saas-starter-kit/redis'
import {HttpClientModule, loadHttpClientConfigFromEnv} from '@b2b-saas-starter-kit/http-client'
import {SecurityModule} from '@b2b-saas-starter-kit/security'
import {NodeInfrastructureModule} from '@b2b-saas-starter-kit/node'

import {AuthorizationModule} from './authorization/authorization.module'
import {IdentityModule} from './identity/identity.module'
import {AssertActiveMembership} from './principal/assert-active-membership'
import {TenancyModule} from './tenancy/tenancy.module'

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
    NodeInfrastructureModule,
    SecurityModule,
    TenancyModule,
    IdentityModule,
    AuthorizationModule,
  ],
  providers: [
    AuthorizationService,
    {provide: AUTHORIZATION, useExisting: AuthorizationService},
    AssertActiveMembership,
    CreateTenantUseCase,
    GetMyProfileQuery,
    GetTenantQuery,
    ListTenantMembersQuery,
    InviteMemberUseCase,
    AcceptInvitationUseCase,
    AttachMemberUseCase,
    ReplaceMembershipRolesUseCase,
    LoginUseCase,
    SelectTenantUseCase,
    ListRolesQuery,
    CreateCustomRoleUseCase,
    UpdateCustomRoleUseCase,
    DeleteCustomRoleUseCase,
  ],
  exports: [
    IdentityModule,
    TenancyModule,
    AuthorizationModule,
    CreateTenantUseCase,
    GetMyProfileQuery,
    GetTenantQuery,
    ListTenantMembersQuery,
    InviteMemberUseCase,
    AcceptInvitationUseCase,
    AttachMemberUseCase,
    ReplaceMembershipRolesUseCase,
    LoginUseCase,
    SelectTenantUseCase,
    ListRolesQuery,
    CreateCustomRoleUseCase,
    UpdateCustomRoleUseCase,
    DeleteCustomRoleUseCase,
    AuthorizationService,
    AUTHORIZATION,
    AssertActiveMembership,
  ],
})
export class CompositionModule {}
