import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type LocalPasswordReconstituteProps = {
  readonly userId: UserId
  readonly passwordHash: string
}
