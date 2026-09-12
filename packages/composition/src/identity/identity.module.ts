import {Module} from '@nestjs/common'

import type {
  Clock,
  IdGenerator,
  MailerPort,
  PasswordHasher,
  TokenDigest,
  UnitOfWork,
} from '@b2b-saas-starter-kit/platform'

import {
  CreateUserUseCase,
  LoggingMailer,
  LoginUseCase,
  LogoutUseCase,
  RegisterUserUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
  RotateRefreshUseCase,
  SelectTenantUseCase,
} from '@b2b-saas-starter-kit/application'

import {
  MAILER,
  TypeOrmLocalPasswordRepository,
  TypeOrmMembershipRepository,
  TypeOrmPasswordResetTokenRepository,
  TypeOrmRefreshSessionRepository,
  TypeOrmUserRepository,
  UNIT_OF_WORK,
} from '@b2b-saas-starter-kit/postgres'
import {PASSWORD_HASHER, TOKEN_DIGEST} from '@b2b-saas-starter-kit/security'
import {CLOCK, ID_GENERATOR} from '@b2b-saas-starter-kit/node'

@Module({
  providers: [
    TypeOrmUserRepository,
    TypeOrmLocalPasswordRepository,
    TypeOrmRefreshSessionRepository,
    TypeOrmPasswordResetTokenRepository,
    TypeOrmMembershipRepository,
    LoggingMailer,
    {
      provide: MAILER,
      useExisting: LoggingMailer,
    },
    {
      provide: CreateUserUseCase,
      useFactory: (uow: UnitOfWork, clock: Clock, ids: IdGenerator, users: TypeOrmUserRepository) =>
        new CreateUserUseCase(uow, clock, ids, users),
      inject: [UNIT_OF_WORK, CLOCK, ID_GENERATOR, TypeOrmUserRepository],
    },
    {
      provide: RegisterUserUseCase,
      useFactory: (
        uow: UnitOfWork,
        clock: Clock,
        ids: IdGenerator,
        hasher: PasswordHasher,
        users: TypeOrmUserRepository,
        passwords: TypeOrmLocalPasswordRepository,
      ) => new RegisterUserUseCase(uow, clock, ids, hasher, users, passwords),
      inject: [
        UNIT_OF_WORK,
        CLOCK,
        ID_GENERATOR,
        PASSWORD_HASHER,
        TypeOrmUserRepository,
        TypeOrmLocalPasswordRepository,
      ],
    },
    {
      provide: LoginUseCase,
      useFactory: (
        uow: UnitOfWork,
        clock: Clock,
        ids: IdGenerator,
        hasher: PasswordHasher,
        digest: TokenDigest,
        users: TypeOrmUserRepository,
        passwords: TypeOrmLocalPasswordRepository,
        sessions: TypeOrmRefreshSessionRepository,
        memberships: TypeOrmMembershipRepository,
      ) => new LoginUseCase(uow, clock, ids, hasher, digest, users, passwords, sessions, memberships),
      inject: [
        UNIT_OF_WORK,
        CLOCK,
        ID_GENERATOR,
        PASSWORD_HASHER,
        TOKEN_DIGEST,
        TypeOrmUserRepository,
        TypeOrmLocalPasswordRepository,
        TypeOrmRefreshSessionRepository,
        TypeOrmMembershipRepository,
      ],
    },
    {
      provide: RotateRefreshUseCase,
      useFactory: (
        uow: UnitOfWork,
        clock: Clock,
        ids: IdGenerator,
        digest: TokenDigest,
        sessions: TypeOrmRefreshSessionRepository,
      ) => new RotateRefreshUseCase(uow, clock, ids, digest, sessions),
      inject: [UNIT_OF_WORK, CLOCK, ID_GENERATOR, TOKEN_DIGEST, TypeOrmRefreshSessionRepository],
    },
    {
      provide: LogoutUseCase,
      useFactory: (uow: UnitOfWork, clock: Clock, digest: TokenDigest, sessions: TypeOrmRefreshSessionRepository) =>
        new LogoutUseCase(uow, clock, digest, sessions),
      inject: [UNIT_OF_WORK, CLOCK, TOKEN_DIGEST, TypeOrmRefreshSessionRepository],
    },
    {
      provide: SelectTenantUseCase,
      useFactory: (memberships: TypeOrmMembershipRepository) => new SelectTenantUseCase(memberships),
      inject: [TypeOrmMembershipRepository],
    },
    {
      provide: RequestPasswordResetUseCase,
      useFactory: (
        uow: UnitOfWork,
        clock: Clock,
        ids: IdGenerator,
        digest: TokenDigest,
        mailer: MailerPort,
        users: TypeOrmUserRepository,
        resetTokens: TypeOrmPasswordResetTokenRepository,
      ) => new RequestPasswordResetUseCase(uow, clock, ids, digest, mailer, users, resetTokens),
      inject: [
        UNIT_OF_WORK,
        CLOCK,
        ID_GENERATOR,
        TOKEN_DIGEST,
        MAILER,
        TypeOrmUserRepository,
        TypeOrmPasswordResetTokenRepository,
      ],
    },
    {
      provide: ResetPasswordUseCase,
      useFactory: (
        uow: UnitOfWork,
        clock: Clock,
        hasher: PasswordHasher,
        digest: TokenDigest,
        passwords: TypeOrmLocalPasswordRepository,
        resetTokens: TypeOrmPasswordResetTokenRepository,
        sessions: TypeOrmRefreshSessionRepository,
      ) => new ResetPasswordUseCase(uow, clock, hasher, digest, passwords, resetTokens, sessions),
      inject: [
        UNIT_OF_WORK,
        CLOCK,
        PASSWORD_HASHER,
        TOKEN_DIGEST,
        TypeOrmLocalPasswordRepository,
        TypeOrmPasswordResetTokenRepository,
        TypeOrmRefreshSessionRepository,
      ],
    },
  ],
  exports: [
    TypeOrmUserRepository,
    TypeOrmLocalPasswordRepository,
    TypeOrmRefreshSessionRepository,
    TypeOrmPasswordResetTokenRepository,
    CreateUserUseCase,
    RegisterUserUseCase,
    LoginUseCase,
    RotateRefreshUseCase,
    LogoutUseCase,
    SelectTenantUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
  ],
})
export class IdentityModule {}
