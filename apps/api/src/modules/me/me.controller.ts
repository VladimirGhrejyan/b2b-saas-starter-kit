import {Controller} from '@nestjs/common'

import {HttpStatus} from '@b2b-saas-starter-kit/contracts'

import {ApiErrorResponses, ApiRoute, Response} from '@b2b-saas-starter-kit/nest-http'

import {CurrentPrincipal} from '../../common/auth/principal/current-principal.decorator'
import type {AuthPrincipal} from '../../common/auth/principal/dev-principal.types'
import {requireUserPrincipal} from '../../common/auth/principal/require-user-principal'

import {MeOutputDto} from './dto/me.output'
import {MeRoutes} from './me.routes'
import {MeService} from './me.service'

@Controller()
export class MeController {
  constructor(private readonly me: MeService) {}

  @ApiRoute(MeRoutes.get)
  @Response({
    status: HttpStatus.OK,
    description: 'Current user profile, membership, and effective permissions',
    type: MeOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.UNAUTHORIZED, description: 'x-user-id or x-tenant-id is missing or invalid'},
    {status: HttpStatus.FORBIDDEN, description: 'Active membership is required or the principal is an API key'},
    {status: HttpStatus.NOT_FOUND, description: 'Actor user was not found'},
  ])
  get(@CurrentPrincipal() principal: AuthPrincipal): Promise<MeOutputDto> {
    requireUserPrincipal(principal)

    return this.me.get()
  }
}
