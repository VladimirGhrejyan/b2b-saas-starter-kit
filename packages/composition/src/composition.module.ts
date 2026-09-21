import {Module} from '@nestjs/common'

import {
  AcceptInvitationUseCase,
  AttachMemberUseCase,
  AUTHORIZATION,
  AuthorizationService,
  CreateApiKeyUseCase,
  CreateCustomRoleUseCase,
  CreateTenantUseCase,
  DeleteCustomRoleUseCase,
  GetMyProfileQuery,
  GetTenantQuery,
  InviteMemberUseCase,
  ListApiKeysQuery,
  ListRolesQuery,
  ListTenantMembersQuery,
  LoginUseCase,
  ReplaceMembershipRolesUseCase,
  RevokeApiKeyUseCase,
  SelectTenantUseCase,
  UpdateApiKeyUseCase,
  UpdateCustomRoleUseCase,
} from '@b2b-saas-starter-kit/application'

import {PostgresInfrastructureModule} from '@b2b-saas-starter-kit/postgres'
import {RedisInfrastructureModule} from '@b2b-saas-starter-kit/redis'
import {HttpClientModule} from '@b2b-saas-starter-kit/http-client'
import {SecurityModule} from '@b2b-saas-starter-kit/security'
import {NodeInfrastructureModule} from '@b2b-saas-starter-kit/node'

import {AuthorizationModule} from './authorization/authorization.module'
import {COMPOSITION_RUNTIME_CONFIG} from './config/composition-runtime-config.token'
import type {CompositionRuntimeConfig} from './config/composition-runtime-config.types'
import {CompositionInfraConfigMapper} from './config/map-composition-infra-config'
import {FileStorageModule} from './file-storage/file-storage.module'
import {HealthIndicatorsModule} from './health/health-indicators.module'
import {IdentityModule} from './identity/identity.module'
import {AssertActiveMembership} from './principal/assert-active-membership'
import {TenancyModule} from './tenancy/tenancy.module'

@Module({
  imports: [
    PostgresInfrastructureModule.forRootAsync({
      inject: [COMPOSITION_RUNTIME_CONFIG],
      useFactory: (...args: unknown[]) =>
        CompositionInfraConfigMapper.postgres((args[0] as CompositionRuntimeConfig).postgres),
    }),
    RedisInfrastructureModule.forRootAsync({
      inject: [COMPOSITION_RUNTIME_CONFIG],
      useFactory: (...args: unknown[]) =>
        CompositionInfraConfigMapper.redis((args[0] as CompositionRuntimeConfig).redis),
    }),
    HttpClientModule.forRootAsync({
      inject: [COMPOSITION_RUNTIME_CONFIG],
      useFactory: (...args: unknown[]) =>
        CompositionInfraConfigMapper.httpClient((args[0] as CompositionRuntimeConfig).httpClient),
    }),
    NodeInfrastructureModule,
    FileStorageModule,
    SecurityModule,
    TenancyModule,
    IdentityModule,
    AuthorizationModule,
    HealthIndicatorsModule,
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
    CreateApiKeyUseCase,
    ListApiKeysQuery,
    UpdateApiKeyUseCase,
    RevokeApiKeyUseCase,
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
    CreateApiKeyUseCase,
    ListApiKeysQuery,
    UpdateApiKeyUseCase,
    RevokeApiKeyUseCase,
    AuthorizationService,
    AUTHORIZATION,
    HealthIndicatorsModule,
    AssertActiveMembership,
  ],
})
export class CompositionModule {}
