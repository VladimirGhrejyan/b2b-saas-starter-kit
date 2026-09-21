import {Module} from '@nestjs/common'

import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

import {
  API_KEY_REPOSITORY,
  LOCAL_PASSWORD_REPOSITORY,
  PASSWORD_RESET_TOKEN_REPOSITORY,
  REFRESH_SESSION_REPOSITORY,
  USER_REPOSITORY,
} from '@b2b-saas-starter-kit/domain'

import type {MailerPort} from '@b2b-saas-starter-kit/platform'
import {MAILER} from '@b2b-saas-starter-kit/platform'

import {
  API_KEY_PERMISSIONS,
  ApiKeyPermissionsService,
  CreateUserUseCase,
  LoggingMailer,
  LogoutUseCase,
  RegisterUserUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
  ResolveApiKeyQuery,
  RotateRefreshUseCase,
  SetOrChangePasswordUseCase,
  TouchApiKeyLastUsed,
} from '@b2b-saas-starter-kit/application'

import {
  TypeOrmApiKeyRepository,
  TypeOrmLocalPasswordRepository,
  TypeOrmPasswordResetTokenRepository,
  TypeOrmRefreshSessionRepository,
  TypeOrmUserRepository,
} from '@b2b-saas-starter-kit/postgres'
import {HttpMailer, SmtpMailer} from '@b2b-saas-starter-kit/mail'

import {COMPOSITION_RUNTIME_CONFIG} from '../config/composition-runtime-config.token'
import type {CompositionRuntimeConfig} from '../config/composition-runtime-config.types'
import {CompositionInfraConfigMapper} from '../config/map-composition-infra-config'

@Module({
  providers: [
    {provide: USER_REPOSITORY, useClass: TypeOrmUserRepository},
    {provide: API_KEY_REPOSITORY, useClass: TypeOrmApiKeyRepository},
    ApiKeyPermissionsService,
    {provide: API_KEY_PERMISSIONS, useExisting: ApiKeyPermissionsService},
    ResolveApiKeyQuery,
    TouchApiKeyLastUsed,
    {provide: LOCAL_PASSWORD_REPOSITORY, useClass: TypeOrmLocalPasswordRepository},
    {provide: REFRESH_SESSION_REPOSITORY, useClass: TypeOrmRefreshSessionRepository},
    {provide: PASSWORD_RESET_TOKEN_REPOSITORY, useClass: TypeOrmPasswordResetTokenRepository},
    LoggingMailer,
    {
      provide: MAILER,
      useFactory: (logging: LoggingMailer, runtime: CompositionRuntimeConfig): MailerPort => {
        const mail = runtime.mail

        if (TypeScriptUtils.isNil(mail)) {
          return logging
        }

        if (mail.transport === 'smtp') {
          return new SmtpMailer(CompositionInfraConfigMapper.smtp(mail))
        }

        return new HttpMailer(CompositionInfraConfigMapper.httpMail(mail))
      },
      inject: [LoggingMailer, COMPOSITION_RUNTIME_CONFIG],
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
    API_KEY_REPOSITORY,
    API_KEY_PERMISSIONS,
    ResolveApiKeyQuery,
    TouchApiKeyLastUsed,
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
