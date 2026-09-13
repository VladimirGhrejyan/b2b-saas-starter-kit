import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type CreateUserCommand = {
  readonly email: string
  readonly displayName: string
}

export type CreateUserResult = {
  readonly userId: UserId
}
