import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type RotateRefreshCommand = {
  readonly refreshToken: string
}

export type RotateRefreshResult = {
  readonly userId: UserId
  readonly refreshToken: string
}
