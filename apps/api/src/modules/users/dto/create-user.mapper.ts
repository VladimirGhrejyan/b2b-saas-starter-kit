import type {CreateUserInput, CreateUserOutput} from '@b2b-saas-starter-kit/contracts'

import type {CreateUserUseCase} from '@b2b-saas-starter-kit/composition'

export class CreateUserMapper {
  static toCommand(input: CreateUserInput): Parameters<CreateUserUseCase['execute']>[0] {
    return {
      email: input.email,
      displayName: input.displayName,
    }
  }

  static toOutput(result: Awaited<ReturnType<CreateUserUseCase['execute']>>): CreateUserOutput {
    return {id: result.userId}
  }
}
