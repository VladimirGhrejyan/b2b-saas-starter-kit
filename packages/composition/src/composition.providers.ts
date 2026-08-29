import type {Provider} from '@nestjs/common'

import type {CachePort, Clock, IdGenerator, UnitOfWork} from '@b2b-saas-starter-kit/platform'

import {
  AuthorizationService,
  CreateTenantUseCase,
  GetMyProfileQuery,
  ListTenantMembersQuery,
  MembershipRolesService,
} from '@b2b-saas-starter-kit/application'

import {
  CLOCK,
  ID_GENERATOR,
  TypeOrmMembershipRepository,
  TypeOrmRoleRepository,
  TypeOrmTenantRepository,
  TypeOrmUserRepository,
  UNIT_OF_WORK,
} from '@b2b-saas-starter-kit/postgres'
import {CACHE} from '@b2b-saas-starter-kit/redis'

import {AssertActiveMembership} from './principal/assert-active-membership'

export const compositionProviders: Provider[] = [
  AssertActiveMembership,
  {
    provide: AuthorizationService,
    useFactory: (roles: TypeOrmRoleRepository, membershipRoles: MembershipRolesService, cache: CachePort) =>
      new AuthorizationService(roles, membershipRoles, cache),
    inject: [TypeOrmRoleRepository, MembershipRolesService, CACHE],
  },
  {
    provide: CreateTenantUseCase,
    useFactory: (
      uow: UnitOfWork,
      clock: Clock,
      ids: IdGenerator,
      users: TypeOrmUserRepository,
      tenants: TypeOrmTenantRepository,
      roles: TypeOrmRoleRepository,
      memberships: TypeOrmMembershipRepository,
    ) => new CreateTenantUseCase(uow, clock, ids, users, tenants, roles, memberships),
    inject: [
      UNIT_OF_WORK,
      CLOCK,
      ID_GENERATOR,
      TypeOrmUserRepository,
      TypeOrmTenantRepository,
      TypeOrmRoleRepository,
      TypeOrmMembershipRepository,
    ],
  },
  {
    provide: GetMyProfileQuery,
    useFactory: (users: TypeOrmUserRepository, memberships: TypeOrmMembershipRepository, authz: AuthorizationService) =>
      new GetMyProfileQuery(users, memberships, authz),
    inject: [TypeOrmUserRepository, TypeOrmMembershipRepository, AuthorizationService],
  },
  {
    provide: ListTenantMembersQuery,
    useFactory: (authz: AuthorizationService, memberships: TypeOrmMembershipRepository) =>
      new ListTenantMembersQuery(authz, memberships),
    inject: [AuthorizationService, TypeOrmMembershipRepository],
  },
]
