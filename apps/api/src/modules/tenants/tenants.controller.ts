import {Body, Controller, Param} from '@nestjs/common'

import {HttpStatus, PermissionName} from '@b2b-saas-starter-kit/contracts'

import {ApiErrorResponses, ApiRoute, Response} from '@b2b-saas-starter-kit/nest-http'

import {CurrentPrincipal} from '../../common/auth/current-principal.decorator'
import type {DevPrincipal} from '../../common/auth/dev-principal.types'
import {RequirePermission} from '../../common/auth/require-permission.decorator'
import {TenantOptional} from '../../common/auth/tenant-optional.decorator'

import {CreateTenantInputDto} from './dto/create-tenant.input'
import {CreateTenantOutputDto} from './dto/create-tenant.output'
import {GetTenantOutputDto} from './dto/get-tenant.output'
import {TenantIdParamDto} from './dto/tenant-id.param'
import {TenantsRoutes} from './tenants.routes'
import {TenantsService} from './tenants.service'

@Controller()
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @TenantOptional()
  @ApiRoute(TenantsRoutes.create)
  @Response({
    status: HttpStatus.CREATED,
    description: 'Tenant created with Owner, Admin, and Member roles',
    type: CreateTenantOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'x-user-id is missing or invalid'},
    {status: HttpStatus.NOT_FOUND, description: 'Owner user was not found'},
  ])
  create(
    @Body() body: CreateTenantInputDto,
    @CurrentPrincipal() principal: DevPrincipal,
  ): Promise<CreateTenantOutputDto> {
    return this.tenants.create(body, principal.userId)
  }

  @RequirePermission(PermissionName.tenancyTenantRead)
  @ApiRoute(TenantsRoutes.get)
  @Response({
    status: HttpStatus.OK,
    description: 'Tenant',
    type: GetTenantOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Path parameters failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'x-user-id or x-tenant-id is missing or invalid'},
    {status: HttpStatus.FORBIDDEN, description: 'Missing tenancy.tenant.read or no active membership'},
    {status: HttpStatus.NOT_FOUND, description: 'Tenant was not found'},
  ])
  get(@Param() params: TenantIdParamDto, @CurrentPrincipal() principal: DevPrincipal): Promise<GetTenantOutputDto> {
    return this.tenants.get(params.tenantId, principal.userId)
  }
}
