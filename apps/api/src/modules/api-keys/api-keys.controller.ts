import {Body, Controller, HttpCode, Param} from '@nestjs/common'

import {HttpStatus, PermissionName} from '@b2b-saas-starter-kit/contracts'

import {ApiErrorResponses, ApiRoute, Idempotent, Response} from '@b2b-saas-starter-kit/nest-http'

import {RequirePermission} from '../../common/auth/permission/require-permission.decorator'
import {CurrentPrincipal} from '../../common/auth/principal/current-principal.decorator'
import type {AuthPrincipal} from '../../common/auth/principal/dev-principal.types'
import {toTenantActor} from '../../common/auth/principal/to-tenant-actor'
import {ApiKeyRateLimits} from '../../common/auth/rate-limit/api-key-rate-limits'
import {RateLimit} from '../../common/auth/rate-limit/rate-limit.decorator'

import {ApiKeyOutputDto} from './dto/api-key.output'
import {ApiKeyIdParamDto} from './dto/api-key-id.param'
import {CreateApiKeyInputDto} from './dto/create-api-key.input'
import {CreateApiKeyOutputDto} from './dto/create-api-key.output'
import {TenantApiKeysOutputDto} from './dto/tenant-api-keys.output'
import {TenantIdParamDto} from './dto/tenant-id.param'
import {UpdateApiKeyInputDto} from './dto/update-api-key.input'
import {ApiKeysRoutes} from './api-keys.routes'
import {ApiKeysService} from './api-keys.service'

@Controller()
export class ApiKeysController {
  constructor(private readonly apiKeys: ApiKeysService) {}

  @RequirePermission(PermissionName.identityApiKeysManage)
  @Idempotent()
  @RateLimit(ApiKeyRateLimits.create)
  @ApiRoute(ApiKeysRoutes.create)
  @Response({
    status: HttpStatus.CREATED,
    description: 'API key created; the raw token is returned once',
    type: CreateApiKeyOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'Bearer token is missing or invalid'},
    {status: HttpStatus.FORBIDDEN, description: 'Missing identity.api_keys.manage or a requested permission'},
    {status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many API key creates'},
    {status: HttpStatus.CONFLICT, description: 'Idempotency-Key is in progress or was reused'},
  ])
  create(
    @Param() params: TenantIdParamDto,
    @Body() body: CreateApiKeyInputDto,
    @CurrentPrincipal() principal: AuthPrincipal,
  ): Promise<CreateApiKeyOutputDto> {
    return this.apiKeys.create(params.tenantId, toTenantActor(principal), body)
  }

  @RequirePermission(PermissionName.identityApiKeysManage)
  @RateLimit(ApiKeyRateLimits.list)
  @ApiRoute(ApiKeysRoutes.list)
  @Response({
    status: HttpStatus.OK,
    description: 'Tenant API keys',
    type: TenantApiKeysOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Path parameters failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'Bearer token is missing or invalid'},
    {status: HttpStatus.FORBIDDEN, description: 'Missing identity.api_keys.manage'},
    {status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many API key lists'},
  ])
  list(
    @Param() params: TenantIdParamDto,
    @CurrentPrincipal() principal: AuthPrincipal,
  ): Promise<TenantApiKeysOutputDto> {
    return this.apiKeys.list(params.tenantId, toTenantActor(principal))
  }

  @RequirePermission(PermissionName.identityApiKeysManage)
  @ApiRoute(ApiKeysRoutes.update)
  @Response({
    status: HttpStatus.OK,
    description: 'API key updated',
    type: ApiKeyOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'Bearer token is missing or invalid'},
    {status: HttpStatus.FORBIDDEN, description: 'Missing identity.api_keys.manage or a requested permission'},
    {status: HttpStatus.NOT_FOUND, description: 'API key was not found'},
  ])
  update(
    @Param() params: ApiKeyIdParamDto,
    @Body() body: UpdateApiKeyInputDto,
    @CurrentPrincipal() principal: AuthPrincipal,
  ): Promise<ApiKeyOutputDto> {
    return this.apiKeys.update(params.tenantId, params.apiKeyId, toTenantActor(principal), body)
  }

  @RequirePermission(PermissionName.identityApiKeysManage)
  @RateLimit(ApiKeyRateLimits.revoke)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRoute(ApiKeysRoutes.revoke)
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Path parameters failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'Bearer token is missing or invalid'},
    {status: HttpStatus.FORBIDDEN, description: 'Missing identity.api_keys.manage'},
    {status: HttpStatus.NOT_FOUND, description: 'API key was not found'},
    {status: HttpStatus.CONFLICT, description: 'API key is already revoked'},
    {status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many API key revokes'},
  ])
  revoke(@Param() params: ApiKeyIdParamDto, @CurrentPrincipal() principal: AuthPrincipal): Promise<void> {
    return this.apiKeys.revoke(params.tenantId, params.apiKeyId, toTenantActor(principal))
  }
}
