import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type SetOrChangePasswordCommand = {
  readonly actorId: UserId
  readonly password: string
  readonly currentPassword?: string
}
