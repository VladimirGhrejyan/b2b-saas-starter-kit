import type {Provider} from '@nestjs/common'

import type {
  CachePort,
  Clock,
  IdGenerator,
  MailerPort,
  PasswordHasher,
  TokenDigest,
  UnitOfWork,
} from '@b2b-saas-starter-kit/platform'

import {
  AcceptInvitationUseCase,
  AttachMemberUseCase,
  AuthorizationService,
  CreateCustomRoleUseCase,
  CreateTenantUseCase,
  DeleteCustomRoleUseCase,
  GetMyProfileQuery,
  GetTenantQuery,
  InviteMemberUseCase,
  ListRolesQuery,
  ListTenantMembersQuery,
  MembershipRolesService,
  ReplaceMembershipRolesUseCase,
  UpdateCustomRoleUseCase,
} from '@b2b-saas-starter-kit/application'

import {
  MAILER,
  TypeOrmInvitationRepository,
  TypeOrmLocalPasswordRepository,
  TypeOrmMembershipRepository,
  TypeOrmRoleRepository,
  TypeOrmTenantRepository,
  TypeOrmUserRepository,
  UNIT_OF_WORK,
} from '@b2b-saas-starter-kit/postgres'
import {CACHE} from '@b2b-saas-starter-kit/redis'
import {PASSWORD_HASHER, TOKEN_DIGEST} from '@b2b-saas-starter-kit/security'
import {CLOCK, ID_GENERATOR} from '@b2b-saas-starter-kit/node'

import {AssertActiveMembership} from './principal/assert-active-membership'

export const compositionProviders: Provider[] = [
  AssertActiveMembership,
  {
    provide: AuthorizationService,
    useFactory: (
      roles: TypeOrmRoleRepository,
      membershipRoles: MembershipRolesService,
      cache: CachePort,
      memberships: TypeOrmMembershipRepository,
    ) => new AuthorizationService(roles, membershipRoles, cache, memberships),
    inject: [TypeOrmRoleRepository, MembershipRolesService, CACHE, TypeOrmMembershipRepository],
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
    useFactory: (authz: AuthorizationService, memberships: TypeOrmMembershipRepository, users: TypeOrmUserRepository) =>
      new ListTenantMembersQuery(authz, memberships, users),
    inject: [AuthorizationService, TypeOrmMembershipRepository, TypeOrmUserRepository],
  },
  {
    provide: GetTenantQuery,
    useFactory: (authz: AuthorizationService, tenants: TypeOrmTenantRepository) => new GetTenantQuery(authz, tenants),
    inject: [AuthorizationService, TypeOrmTenantRepository],
  },
  {
    provide: InviteMemberUseCase,
    useFactory: (
      uow: UnitOfWork,
      clock: Clock,
      ids: IdGenerator,
      digest: TokenDigest,
      mailer: MailerPort,
      authz: AuthorizationService,
      users: TypeOrmUserRepository,
      memberships: TypeOrmMembershipRepository,
      roles: TypeOrmRoleRepository,
      invitations: TypeOrmInvitationRepository,
    ) => new InviteMemberUseCase(uow, clock, ids, digest, mailer, authz, users, memberships, roles, invitations),
    inject: [
      UNIT_OF_WORK,
      CLOCK,
      ID_GENERATOR,
      TOKEN_DIGEST,
      MAILER,
      AuthorizationService,
      TypeOrmUserRepository,
      TypeOrmMembershipRepository,
      TypeOrmRoleRepository,
      TypeOrmInvitationRepository,
    ],
  },
  {
    provide: AcceptInvitationUseCase,
    useFactory: (
      uow: UnitOfWork,
      clock: Clock,
      ids: IdGenerator,
      hasher: PasswordHasher,
      digest: TokenDigest,
      authz: AuthorizationService,
      users: TypeOrmUserRepository,
      passwords: TypeOrmLocalPasswordRepository,
      memberships: TypeOrmMembershipRepository,
      invitations: TypeOrmInvitationRepository,
    ) =>
      new AcceptInvitationUseCase(uow, clock, ids, hasher, digest, authz, users, passwords, memberships, invitations),
    inject: [
      UNIT_OF_WORK,
      CLOCK,
      ID_GENERATOR,
      PASSWORD_HASHER,
      TOKEN_DIGEST,
      AuthorizationService,
      TypeOrmUserRepository,
      TypeOrmLocalPasswordRepository,
      TypeOrmMembershipRepository,
      TypeOrmInvitationRepository,
    ],
  },
  {
    provide: AttachMemberUseCase,
    useFactory: (
      uow: UnitOfWork,
      clock: Clock,
      ids: IdGenerator,
      authz: AuthorizationService,
      users: TypeOrmUserRepository,
      memberships: TypeOrmMembershipRepository,
      roles: TypeOrmRoleRepository,
    ) => new AttachMemberUseCase(uow, clock, ids, authz, users, memberships, roles),
    inject: [
      UNIT_OF_WORK,
      CLOCK,
      ID_GENERATOR,
      AuthorizationService,
      TypeOrmUserRepository,
      TypeOrmMembershipRepository,
      TypeOrmRoleRepository,
    ],
  },
  {
    provide: ReplaceMembershipRolesUseCase,
    useFactory: (
      uow: UnitOfWork,
      clock: Clock,
      authz: AuthorizationService,
      memberships: TypeOrmMembershipRepository,
      roles: TypeOrmRoleRepository,
    ) => new ReplaceMembershipRolesUseCase(uow, clock, authz, memberships, roles),
    inject: [UNIT_OF_WORK, CLOCK, AuthorizationService, TypeOrmMembershipRepository, TypeOrmRoleRepository],
  },
  {
    provide: ListRolesQuery,
    useFactory: (authz: AuthorizationService, roles: TypeOrmRoleRepository) => new ListRolesQuery(authz, roles),
    inject: [AuthorizationService, TypeOrmRoleRepository],
  },
  {
    provide: CreateCustomRoleUseCase,
    useFactory: (
      uow: UnitOfWork,
      clock: Clock,
      ids: IdGenerator,
      authz: AuthorizationService,
      roles: TypeOrmRoleRepository,
    ) => new CreateCustomRoleUseCase(uow, clock, ids, authz, roles),
    inject: [UNIT_OF_WORK, CLOCK, ID_GENERATOR, AuthorizationService, TypeOrmRoleRepository],
  },
  {
    provide: UpdateCustomRoleUseCase,
    useFactory: (uow: UnitOfWork, clock: Clock, authz: AuthorizationService, roles: TypeOrmRoleRepository) =>
      new UpdateCustomRoleUseCase(uow, clock, authz, roles),
    inject: [UNIT_OF_WORK, CLOCK, AuthorizationService, TypeOrmRoleRepository],
  },
  {
    provide: DeleteCustomRoleUseCase,
    useFactory: (
      uow: UnitOfWork,
      authz: AuthorizationService,
      roles: TypeOrmRoleRepository,
      memberships: TypeOrmMembershipRepository,
    ) => new DeleteCustomRoleUseCase(uow, authz, roles, memberships),
    inject: [UNIT_OF_WORK, AuthorizationService, TypeOrmRoleRepository, TypeOrmMembershipRepository],
  },
]
