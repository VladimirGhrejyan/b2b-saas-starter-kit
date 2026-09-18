import {Body, Controller, HttpCode, Param} from '@nestjs/common'

import {HttpStatus, PermissionName} from '@b2b-saas-starter-kit/contracts'

import {ApiErrorResponses, ApiRoute, Idempotent, Response} from '@b2b-saas-starter-kit/nest-http'

import {RequirePermission} from '../../common/auth/permission/require-permission.decorator'
import {CurrentPrincipal} from '../../common/auth/principal/current-principal.decorator'
import type {DevPrincipal} from '../../common/auth/principal/dev-principal.types'

import {CreateRoleInputDto} from './dto/create-role.input'
import {RoleOutputDto} from './dto/role.output'
import {RoleIdParamDto} from './dto/role-id.param'
import {TenantIdParamDto} from './dto/tenant-id.param'
import {TenantRolesOutputDto} from './dto/tenant-roles.output'
import {UpdateRoleInputDto} from './dto/update-role.input'
import {RolesRoutes} from './roles.routes'
import {RolesService} from './roles.service'

@Controller()
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @RequirePermission(PermissionName.authorizationRolesRead)
  @ApiRoute(RolesRoutes.list)
  @Response({
    status: HttpStatus.OK,
    description: 'Tenant roles',
    type: TenantRolesOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Path parameters failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'x-user-id or x-tenant-id is missing or invalid'},
    {status: HttpStatus.FORBIDDEN, description: 'Missing authorization.roles.read or no active membership'},
  ])
  list(@Param() params: TenantIdParamDto, @CurrentPrincipal() principal: DevPrincipal): Promise<TenantRolesOutputDto> {
    return this.roles.list(params.tenantId, principal.userId)
  }

  @RequirePermission(PermissionName.authorizationRolesManage)
  @Idempotent()
  @ApiRoute(RolesRoutes.create)
  @Response({
    status: HttpStatus.CREATED,
    description: 'Custom role created',
    type: RoleOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'x-user-id or x-tenant-id is missing or invalid'},
    {status: HttpStatus.FORBIDDEN, description: 'Missing authorization.roles.manage or no active membership'},
    {status: HttpStatus.CONFLICT, description: 'Role name is taken or reserved'},
  ])
  create(
    @Param() params: TenantIdParamDto,
    @Body() body: CreateRoleInputDto,
    @CurrentPrincipal() principal: DevPrincipal,
  ): Promise<RoleOutputDto> {
    return this.roles.create(params.tenantId, principal.userId, body)
  }

  @RequirePermission(PermissionName.authorizationRolesManage)
  @ApiRoute(RolesRoutes.update)
  @Response({
    status: HttpStatus.OK,
    description: 'Custom role updated',
    type: RoleOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'x-user-id or x-tenant-id is missing or invalid'},
    {status: HttpStatus.FORBIDDEN, description: 'Missing authorization.roles.manage or system role is immutable'},
    {status: HttpStatus.NOT_FOUND, description: 'Role was not found'},
    {status: HttpStatus.CONFLICT, description: 'Role name is taken or reserved'},
  ])
  update(
    @Param() params: RoleIdParamDto,
    @Body() body: UpdateRoleInputDto,
    @CurrentPrincipal() principal: DevPrincipal,
  ): Promise<RoleOutputDto> {
    return this.roles.update(params.tenantId, params.roleId, principal.userId, body)
  }

  @RequirePermission(PermissionName.authorizationRolesManage)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRoute(RolesRoutes.delete)
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Path parameters failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'x-user-id or x-tenant-id is missing or invalid'},
    {status: HttpStatus.FORBIDDEN, description: 'Missing authorization.roles.manage or system role is immutable'},
    {status: HttpStatus.NOT_FOUND, description: 'Role was not found'},
    {status: HttpStatus.CONFLICT, description: 'Role is still assigned to a membership'},
  ])
  delete(@Param() params: RoleIdParamDto, @CurrentPrincipal() principal: DevPrincipal): Promise<void> {
    return this.roles.delete(params.tenantId, params.roleId, principal.userId)
  }
}
