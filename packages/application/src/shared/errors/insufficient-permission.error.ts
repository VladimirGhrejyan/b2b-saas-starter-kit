import type {Permission} from '@b2b-saas-starter-kit/shared-kernel-types'

/**
 * Thrown by {@link AuthorizationPort.require} when the actor lacks a permission.
 */
export class InsufficientPermissionError extends Error {
  readonly code = 'INSUFFICIENT_PERMISSION'

  constructor(permission: Permission) {
    super(`missing permission '${permission}'`)
    this.name = new.target.name
  }
}
