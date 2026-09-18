import {Module} from '@nestjs/common'

import {
  LOCAL_PASSWORD_REPOSITORY,
  PASSWORD_RESET_TOKEN_REPOSITORY,
  REFRESH_SESSION_REPOSITORY,
  USER_REPOSITORY,
} from '@b2b-saas-starter-kit/domain'

import type {MailerPort} from '@b2b-saas-starter-kit/platform'
import {MAILER} from '@b2b-saas-starter-kit/platform'

import {
  CreateUserUseCase,
  LoggingMailer,
  LogoutUseCase,
  RegisterUserUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
  RotateRefreshUseCase,
  SetOrChangePasswordUseCase,
} from '@b2b-saas-starter-kit/application'

import {
  TypeOrmLocalPasswordRepository,
  TypeOrmPasswordResetTokenRepository,
  TypeOrmRefreshSessionRepository,
  TypeOrmUserRepository,
} from '@b2b-saas-starter-kit/postgres'
import {SmtpMailer, tryLoadSmtpConfigFromEnv} from '@b2b-saas-starter-kit/mail'

@Module({
  providers: [
    {provide: USER_REPOSITORY, useClass: TypeOrmUserRepository},
    {provide: LOCAL_PASSWORD_REPOSITORY, useClass: TypeOrmLocalPasswordRepository},
    {provide: REFRESH_SESSION_REPOSITORY, useClass: TypeOrmRefreshSessionRepository},
    {provide: PASSWORD_RESET_TOKEN_REPOSITORY, useClass: TypeOrmPasswordResetTokenRepository},
    LoggingMailer,
    {
      provide: MAILER,
      useFactory: (logging: LoggingMailer): MailerPort => {
        const config = tryLoadSmtpConfigFromEnv()

        return config === null ? logging : new SmtpMailer(config)
      },
      inject: [LoggingMailer],
    },
    CreateUserUseCase,
    RegisterUserUseCase,
    RotateRefreshUseCase,
    LogoutUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    SetOrChangePasswordUseCase,
  ],
  exports: [
    USER_REPOSITORY,
    LOCAL_PASSWORD_REPOSITORY,
    REFRESH_SESSION_REPOSITORY,
    PASSWORD_RESET_TOKEN_REPOSITORY,
    CreateUserUseCase,
    RegisterUserUseCase,
    RotateRefreshUseCase,
    LogoutUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    SetOrChangePasswordUseCase,
    MAILER,
    LoggingMailer,
  ],
})
export class IdentityModule {}
