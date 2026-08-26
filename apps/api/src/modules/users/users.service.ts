import {Injectable} from '@nestjs/common'

import {CreateUserUseCase} from '@b2b-saas-starter-kit/composition'

import type {CreateUserInputDto} from './dto/create-user.input'
import {CreateUserMapper} from './dto/create-user.mapper'
import type {CreateUserOutputDto} from './dto/create-user.output'

@Injectable()
export class UsersService {
  constructor(private readonly createUser: CreateUserUseCase) {}

  async create(input: CreateUserInputDto): Promise<CreateUserOutputDto> {
    const result = await this.createUser.execute(CreateUserMapper.toCommand(input))

    return CreateUserMapper.toOutput(result)
  }
}
