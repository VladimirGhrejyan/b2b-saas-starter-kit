import {Body, Controller, HttpCode, Req, Res} from '@nestjs/common'

import {HttpStatus} from '@b2b-saas-starter-kit/contracts'

import {ApiErrorResponses, ApiRoute, Public, Response} from '@b2b-saas-starter-kit/nest-http'

import {CurrentPrincipal} from '../../common/auth/principal/current-principal.decorator'
import type {AuthPrincipal} from '../../common/auth/principal/dev-principal.types'
import {requireUserPrincipal} from '../../common/auth/principal/require-user-principal'
import {TenantOptional} from '../../common/auth/principal/tenant-optional.decorator'
import {AuthRateLimits} from '../../common/auth/rate-limit/auth-rate-limits'
import {RateLimit} from '../../common/auth/rate-limit/rate-limit.decorator'
import {RefreshCookie} from '../../common/auth/refresh-cookie/refresh-cookie'
import type {RefreshCookieRequest, RefreshCookieResponse} from '../../common/auth/refresh-cookie/refresh-cookie.types'

import {AuthOkOutputDto} from './dto/auth-ok.output'
import {AuthSessionOutputDto} from './dto/auth-session.output'
import {AuthTokenSessionOutputDto} from './dto/auth-token-session.output'
import {ForgotPasswordInputDto} from './dto/forgot-password.input'
import {LoginInputDto} from './dto/login.input'
import {LogoutTokenInputDto} from './dto/logout-token.input'
import {RefreshTokenInputDto} from './dto/refresh-token.input'
import {RegisterUserInputDto} from './dto/register-user.input'
import {RegisterUserOutputDto} from './dto/register-user.output'
import {ResetPasswordInputDto} from './dto/reset-password.input'
import {SelectTenantInputDto} from './dto/select-tenant.input'
import {SetOrChangePasswordInputDto} from './dto/set-or-change-password.input'
import {AuthRoutes} from './auth.routes'
import {AuthService} from './auth.service'

@Controller()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly refreshCookie: RefreshCookie,
  ) {}

  @Public()
  @RateLimit(AuthRateLimits.register)
  @ApiRoute(AuthRoutes.register)
  @Response({
    status: HttpStatus.CREATED,
    description: 'User registered',
    type: RegisterUserOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
    {status: HttpStatus.CONFLICT, description: 'Email is already taken'},
    {status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many registration attempts'},
  ])
  register(@Body() body: RegisterUserInputDto): Promise<RegisterUserOutputDto> {
    return this.auth.register(body)
  }

  @Public()
  @RateLimit(AuthRateLimits.login)
  @HttpCode(HttpStatus.OK)
  @ApiRoute(AuthRoutes.login)
  @Response({
    status: HttpStatus.OK,
    description: 'Signed in with refresh token in the body',
    type: AuthTokenSessionOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'Email or password is invalid'},
    {status: HttpStatus.FORBIDDEN, description: 'User is suspended'},
    {status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many login attempts'},
  ])
  login(@Body() body: LoginInputDto): Promise<AuthTokenSessionOutputDto> {
    return this.auth.tokenSignIn(body)
  }

  @Public()
  @RateLimit(AuthRateLimits.refresh)
  @HttpCode(HttpStatus.OK)
  @ApiRoute(AuthRoutes.refresh)
  @Response({
    status: HttpStatus.OK,
    description: 'Access token refreshed from a body refresh token',
    type: AuthTokenSessionOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'Refresh token is invalid'},
    {status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many refresh attempts'},
  ])
  refresh(@Body() body: RefreshTokenInputDto): Promise<AuthTokenSessionOutputDto> {
    return this.auth.tokenRefresh(body)
  }

  @Public()
  @RateLimit(AuthRateLimits.logout)
  @HttpCode(HttpStatus.OK)
  @ApiRoute(AuthRoutes.logout)
  @Response({
    status: HttpStatus.OK,
    description: 'Signed out',
    type: AuthOkOutputDto,
  })
  @ApiErrorResponses([{status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many logout attempts'}])
  async logout(@Body() body: LogoutTokenInputDto): Promise<AuthOkOutputDto> {
    await this.auth.tokenSignOut(body)

    return {ok: true}
  }

  @Public()
  @RateLimit(AuthRateLimits.login)
  @HttpCode(HttpStatus.OK)
  @ApiRoute(AuthRoutes.webLogin)
  @Response({
    status: HttpStatus.OK,
    description: 'Signed in and set the refresh cookie',
    type: AuthSessionOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'Email or password is invalid'},
    {status: HttpStatus.FORBIDDEN, description: 'User is suspended'},
    {status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many login attempts'},
  ])
  async webLogin(
    @Body() body: LoginInputDto,
    @Res({passthrough: true}) response: RefreshCookieResponse,
  ): Promise<AuthSessionOutputDto> {
    const result = await this.auth.signIn(body)

    this.refreshCookie.set(response, result.refreshToken)

    return result.session
  }

  @Public()
  @RateLimit(AuthRateLimits.refresh)
  @HttpCode(HttpStatus.OK)
  @ApiRoute(AuthRoutes.webRefresh)
  @Response({
    status: HttpStatus.OK,
    description: 'Access token refreshed from the cookie',
    type: AuthSessionOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.UNAUTHORIZED, description: 'Refresh cookie is invalid'},
    {status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many refresh attempts'},
  ])
  async webRefresh(
    @Req() request: RefreshCookieRequest,
    @Res({passthrough: true}) response: RefreshCookieResponse,
  ): Promise<AuthSessionOutputDto> {
    const result = await this.auth.refresh(this.refreshCookie.read(request))

    this.refreshCookie.set(response, result.refreshToken)

    return result.session
  }

  @Public()
  @RateLimit(AuthRateLimits.logout)
  @HttpCode(HttpStatus.OK)
  @ApiRoute(AuthRoutes.webLogout)
  @Response({
    status: HttpStatus.OK,
    description: 'Signed out and cleared the cookie',
    type: AuthOkOutputDto,
  })
  @ApiErrorResponses([{status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many logout attempts'}])
  async webLogout(
    @Req() request: RefreshCookieRequest,
    @Res({passthrough: true}) response: RefreshCookieResponse,
  ): Promise<AuthOkOutputDto> {
    await this.auth.signOut(this.refreshCookie.read(request))
    this.refreshCookie.clear(response)

    return {ok: true}
  }

  @TenantOptional()
  @HttpCode(HttpStatus.OK)
  @ApiRoute(AuthRoutes.selectTenant)
  @Response({
    status: HttpStatus.OK,
    description: 'Access token issued for the selected tenant',
    type: AuthSessionOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'Bearer token is missing or invalid'},
    {status: HttpStatus.FORBIDDEN, description: 'Active membership is required'},
  ])
  selectTenant(
    @Body() body: SelectTenantInputDto,
    @CurrentPrincipal() principal: AuthPrincipal,
  ): Promise<AuthSessionOutputDto> {
    return this.auth.chooseTenant(requireUserPrincipal(principal), body)
  }

  @Public()
  @RateLimit(AuthRateLimits.forgotPassword)
  @HttpCode(HttpStatus.OK)
  @ApiRoute(AuthRoutes.forgotPassword)
  @Response({
    status: HttpStatus.OK,
    description: 'Password reset requested',
    type: AuthOkOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
    {status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many password-reset requests'},
  ])
  async forgotPassword(@Body() body: ForgotPasswordInputDto): Promise<AuthOkOutputDto> {
    await this.auth.forgotPassword(body)

    return {ok: true}
  }

  @Public()
  @RateLimit(AuthRateLimits.resetPassword)
  @HttpCode(HttpStatus.OK)
  @ApiRoute(AuthRoutes.resetPassword)
  @Response({
    status: HttpStatus.OK,
    description: 'Password reset',
    type: AuthOkOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Token or password is invalid'},
    {status: HttpStatus.UNAUTHORIZED, description: 'Reset token is invalid'},
    {status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many password-reset attempts'},
  ])
  async resetPassword(@Body() body: ResetPasswordInputDto): Promise<AuthOkOutputDto> {
    await this.auth.reset(body)

    return {ok: true}
  }

  @TenantOptional()
  @HttpCode(HttpStatus.OK)
  @ApiRoute(AuthRoutes.setOrChangePassword)
  @Response({
    status: HttpStatus.OK,
    description: 'Local password set or changed',
    type: AuthOkOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'Bearer token is missing or current password is invalid'},
    {status: HttpStatus.CONFLICT, description: 'A local password is already set'},
    {status: HttpStatus.NOT_FOUND, description: 'User was not found'},
  ])
  async setOrChangePassword(
    @Body() body: SetOrChangePasswordInputDto,
    @CurrentPrincipal() principal: AuthPrincipal,
  ): Promise<AuthOkOutputDto> {
    await this.auth.updatePassword(requireUserPrincipal(principal), body)

    return {ok: true}
  }
}
