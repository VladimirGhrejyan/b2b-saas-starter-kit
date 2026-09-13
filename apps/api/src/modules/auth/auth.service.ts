import {Injectable} from '@nestjs/common'

import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'
import type {AuthSessionOutput, AuthTokenSessionOutput} from '@b2b-saas-starter-kit/contracts'

import {
  InvalidRefreshTokenError,
  LoginUseCase,
  LogoutUseCase,
  RegisterUserUseCase,
  RequestPasswordResetUseCase,
  ResetPasswordUseCase,
  RotateRefreshUseCase,
  SelectTenantUseCase,
  SetOrChangePasswordUseCase,
} from '@b2b-saas-starter-kit/composition'

import {JwtAccessService} from '../../common/auth/jwt/jwt-access.service'

import type {ForgotPasswordInputDto} from './dto/forgot-password.input'
import type {LoginInputDto} from './dto/login.input'
import type {LogoutTokenInputDto} from './dto/logout-token.input'
import type {RefreshTokenInputDto} from './dto/refresh-token.input'
import type {RegisterUserInputDto} from './dto/register-user.input'
import {RegisterUserMapper} from './dto/register-user.mapper'
import type {RegisterUserOutputDto} from './dto/register-user.output'
import type {ResetPasswordInputDto} from './dto/reset-password.input'
import type {SelectTenantInputDto} from './dto/select-tenant.input'
import type {SetOrChangePasswordInputDto} from './dto/set-or-change-password.input'

@Injectable()
export class AuthService {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly login: LoginUseCase,
    private readonly rotateRefresh: RotateRefreshUseCase,
    private readonly logout: LogoutUseCase,
    private readonly selectTenant: SelectTenantUseCase,
    private readonly requestPasswordReset: RequestPasswordResetUseCase,
    private readonly resetPassword: ResetPasswordUseCase,
    private readonly setOrChangePassword: SetOrChangePasswordUseCase,
    private readonly jwt: JwtAccessService,
  ) {}

  async register(input: RegisterUserInputDto): Promise<RegisterUserOutputDto> {
    const result = await this.registerUser.execute(RegisterUserMapper.toCommand(input))

    return RegisterUserMapper.toOutput(result)
  }

  async signIn(input: LoginInputDto): Promise<{session: AuthSessionOutput; refreshToken: string}> {
    const result = await this.login.execute({email: input.email, password: input.password})

    return {
      session: await this.session(result.userId, result.tenantId),
      refreshToken: result.refreshToken,
    }
  }

  async refresh(refreshToken: string | undefined): Promise<{session: AuthSessionOutput; refreshToken: string}> {
    if (refreshToken === undefined) {
      throw new InvalidRefreshTokenError()
    }

    const result = await this.rotateRefresh.execute({refreshToken})

    return {
      session: await this.session(result.userId),
      refreshToken: result.refreshToken,
    }
  }

  async tokenSignIn(input: LoginInputDto): Promise<AuthTokenSessionOutput> {
    const result = await this.signIn(input)

    return {...result.session, refreshToken: result.refreshToken}
  }

  async tokenRefresh(input: RefreshTokenInputDto): Promise<AuthTokenSessionOutput> {
    const result = await this.refresh(input.refreshToken)

    return {...result.session, refreshToken: result.refreshToken}
  }

  async tokenSignOut(input: LogoutTokenInputDto): Promise<void> {
    await this.signOut(input.refreshToken)
  }

  async signOut(refreshToken: string | undefined): Promise<void> {
    await this.logout.execute({refreshToken})
  }

  async chooseTenant(userId: UserId, input: SelectTenantInputDto): Promise<AuthSessionOutput> {
    const result = await this.selectTenant.execute({userId, tenantId: input.tenantId})

    return this.session(result.userId, result.tenantId)
  }

  async forgotPassword(input: ForgotPasswordInputDto): Promise<void> {
    await this.requestPasswordReset.execute({email: input.email})
  }

  async reset(input: ResetPasswordInputDto): Promise<void> {
    await this.resetPassword.execute({token: input.token, password: input.password})
  }

  async updatePassword(actorId: UserId, input: SetOrChangePasswordInputDto): Promise<void> {
    await this.setOrChangePassword.execute({
      actorId,
      password: input.password,
      currentPassword: input.currentPassword,
    })
  }

  private async session(
    userId: AuthSessionOutput['userId'],
    tenantId?: AuthSessionOutput['tenantId'],
  ): Promise<AuthSessionOutput> {
    return {
      accessToken: await this.jwt.sign({userId, tenantId}),
      expiresIn: this.jwt.expiresIn,
      userId,
      ...(tenantId === undefined ? {} : {tenantId}),
    }
  }
}
