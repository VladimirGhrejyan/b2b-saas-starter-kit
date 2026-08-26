import {Body, Controller} from '@nestjs/common'

import {HttpStatus} from '@b2b-saas-starter-kit/contracts'

import {ApiErrorResponses, ApiRoute, Public, Response} from '@b2b-saas-starter-kit/nest-http'

import {CreateUserInputDto} from './dto/create-user.input'
import {CreateUserOutputDto} from './dto/create-user.output'
import {UsersRoutes} from './users.routes'
import {UsersService} from './users.service'

@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Public()
  @ApiRoute(UsersRoutes.create)
  @Response({
    status: HttpStatus.CREATED,
    description: 'User created',
    type: CreateUserOutputDto,
  })
  @ApiErrorResponses([
    {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
    {status: HttpStatus.CONFLICT, description: 'Email is already taken'},
  ])
  create(@Body() body: CreateUserInputDto): Promise<CreateUserOutputDto> {
    return this.users.create(body)
  }
}
