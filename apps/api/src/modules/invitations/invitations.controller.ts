import {Body, Controller, Param} from '@nestjs/common'

import {HttpStatus, PermissionName} from '@b2b-saas-starter-kit/contracts'

import {ApiErrorResponses, ApiRoute, Public, Response} from '@b2b-saas-starter-kit/nest-http'

import {CurrentPrincipal} from '../../common/auth/current-principal.decorator'
import type {DevPrincipal} from '../../common/auth/dev-principal.types'
import {RequirePermission} from '../../common/auth/require-permission.decorator'

import {AcceptInvitationInputDto} from './dto/accept-invitation.input'
import {AcceptInvitationOutputDto} from './dto/accept-invitation.output'
import {InviteMemberInputDto} from './dto/invite-member.input'
import {InviteMemberOutputDto} from './dto/invite-member.output'
import {TenantIdParamDto} from './dto/tenant-id.param'
import {InvitationsRoutes} from './invitations.routes'
import {InvitationsService} from './invitations.service'

@Controller()
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @RequirePermission(PermissionName.tenancyMembersInvite)
  @ApiRoute(InvitationsRoutes.invite)
  @Response({
    status: HttpStatus.CREATED,
    description: 'Invitation created',
    type: InviteMemberOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
    {status: HttpStatus.UNAUTHORIZED, description: 'x-user-id or x-tenant-id is missing or invalid'},
    {status: HttpStatus.FORBIDDEN, description: 'Missing tenancy.members.invite or Owner role assignment'},
    {status: HttpStatus.CONFLICT, description: 'Pending invitation or membership already exists'},
  ])
  invite(
    @Param() params: TenantIdParamDto,
    @Body() body: InviteMemberInputDto,
    @CurrentPrincipal() principal: DevPrincipal,
  ): Promise<InviteMemberOutputDto> {
    return this.invitations.invite(params.tenantId, principal.userId, body)
  }

  @Public()
  @ApiRoute(InvitationsRoutes.accept)
  @Response({
    status: HttpStatus.CREATED,
    description: 'Invitation accepted',
    type: AcceptInvitationOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Invalid token or missing registration fields'},
    {status: HttpStatus.CONFLICT, description: 'Membership already exists'},
  ])
  accept(@Body() body: AcceptInvitationInputDto): Promise<AcceptInvitationOutputDto> {
    return this.invitations.accept(body)
  }
}
