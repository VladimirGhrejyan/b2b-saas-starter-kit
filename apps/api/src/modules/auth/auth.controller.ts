import {Body, Controller, HttpCode, Req, Res} from '@nestjs/common'

import {HttpStatus} from '@b2b-saas-starter-kit/contracts'

import {ApiErrorResponses, ApiRoute, Public, Response} from '@b2b-saas-starter-kit/nest-http'

import {CurrentPrincipal} from '../../common/auth/current-principal.decorator'
import type {DevPrincipal} from '../../common/auth/dev-principal.types'
import {RefreshCookie} from '../../common/auth/refresh-cookie'
import type {RefreshCookieRequest, RefreshCookieResponse} from '../../common/auth/refresh-cookie.types'
import {TenantOptional} from '../../common/auth/tenant-optional.decorator'

import {AuthOkOutputDto} from './dto/auth-ok.output'
import {AuthSessionOutputDto} from './dto/auth-session.output'
import {ForgotPasswordInputDto} from './dto/forgot-password.input'
import {LoginInputDto} from './dto/login.input'
import {RegisterUserInputDto} from './dto/register-user.input'
import {RegisterUserOutputDto} from './dto/register-user.output'
import {ResetPasswordInputDto} from './dto/reset-password.input'
import {SelectTenantInputDto} from './dto/select-tenant.input'
import {AuthRoutes} from './auth.routes'
import {AuthService} from './auth.service'

@Controller()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly refreshCookie: RefreshCookie,
  ) {}

  @Public()
  @ApiRoute(AuthRoutes.register)
  @Response({
    status: HttpStatus.CREATED,
    description: 'User registered',
    type: RegisterUserOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
    {status: HttpStatus.CONFLICT, description: 'Email is already taken'},
  ])
  register(@Body() body: RegisterUserInputDto): Promise<RegisterUserOutputDto> {
    return this.auth.register(body)
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiRoute(AuthRoutes.login)
  @Response({
    status: HttpStatus.OK,
    description: 'Signed in',
    type: AuthSessionOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'Email or password is invalid'},
    {status: HttpStatus.FORBIDDEN, description: 'User is suspended'},
  ])
  async login(
    @Body() body: LoginInputDto,
    @Res({passthrough: true}) response: RefreshCookieResponse,
  ): Promise<AuthSessionOutputDto> {
    const result = await this.auth.signIn(body)

    this.refreshCookie.set(response, result.refreshToken)

    return result.session
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiRoute(AuthRoutes.refresh)
  @Response({
    status: HttpStatus.OK,
    description: 'Access token refreshed',
    type: AuthSessionOutputDto,
  })
  @ApiErrorResponses([{status: HttpStatus.UNAUTHORIZED, description: 'Refresh cookie is invalid'}])
  async refresh(
    @Req() request: RefreshCookieRequest,
    @Res({passthrough: true}) response: RefreshCookieResponse,
  ): Promise<AuthSessionOutputDto> {
    const result = await this.auth.refresh(this.refreshCookie.read(request))

    this.refreshCookie.set(response, result.refreshToken)

    return result.session
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiRoute(AuthRoutes.logout)
  @Response({
    status: HttpStatus.OK,
    description: 'Signed out',
    type: AuthOkOutputDto,
  })
  async logout(
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
    @CurrentPrincipal() principal: DevPrincipal,
  ): Promise<AuthSessionOutputDto> {
    return this.auth.chooseTenant(principal.userId, body)
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiRoute(AuthRoutes.forgotPassword)
  @Response({
    status: HttpStatus.OK,
    description: 'Password reset requested',
    type: AuthOkOutputDto,
  })
  @ApiErrorResponses([{status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'}])
  async forgotPassword(@Body() body: ForgotPasswordInputDto): Promise<AuthOkOutputDto> {
    await this.auth.forgotPassword(body)

    return {ok: true}
  }

  @Public()
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
  ])
  async resetPassword(@Body() body: ResetPasswordInputDto): Promise<AuthOkOutputDto> {
    await this.auth.reset(body)

    return {ok: true}
  }
}
