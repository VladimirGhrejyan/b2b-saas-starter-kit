import type {RegisterUserInput, RegisterUserOutput} from '@b2b-saas-starter-kit/contracts'

import type {RegisterUserUseCase} from '@b2b-saas-starter-kit/composition'

export class RegisterUserMapper {
  static toCommand(input: RegisterUserInput): Parameters<RegisterUserUseCase['execute']>[0] {
    return {
      email: input.email,
      displayName: input.displayName,
      password: input.password,
    }
  }

  static toOutput(result: Awaited<ReturnType<RegisterUserUseCase['execute']>>): RegisterUserOutput {
    return {userId: result.userId}
  }
}
