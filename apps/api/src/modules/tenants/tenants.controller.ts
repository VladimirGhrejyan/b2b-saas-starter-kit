import {Body, Controller} from '@nestjs/common'

import {HttpStatus} from '@b2b-saas-starter-kit/contracts'

import {ApiErrorResponses, ApiRoute, Response} from '@b2b-saas-starter-kit/nest-http'

import {CurrentPrincipal} from '../../common/auth/current-principal.decorator'
import type {DevPrincipal} from '../../common/auth/dev-principal.types'
import {TenantOptional} from '../../common/auth/tenant-optional.decorator'

import {CreateTenantInputDto} from './dto/create-tenant.input'
import {CreateTenantOutputDto} from './dto/create-tenant.output'
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
    {status: HttpStatus.CONFLICT, description: 'Owner user was not found'},
  ])
  create(
    @Body() body: CreateTenantInputDto,
    @CurrentPrincipal() principal: DevPrincipal,
  ): Promise<CreateTenantOutputDto> {
    return this.tenants.create(body, principal.userId)
  }
}
