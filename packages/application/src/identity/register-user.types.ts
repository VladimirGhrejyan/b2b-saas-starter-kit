import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type RegisterUserCommand = {
  readonly email: string
  readonly displayName: string
  readonly password: string
}

export type RegisterUserResult = {
  readonly userId: UserId
}
