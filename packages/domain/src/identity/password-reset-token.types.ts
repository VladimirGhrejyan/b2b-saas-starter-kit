import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

export type PasswordResetTokenReconstituteProps = {
  readonly userId: UserId
  readonly tokenHash: string
  readonly expiresAt: Date
  readonly consumedAt?: Date
}
