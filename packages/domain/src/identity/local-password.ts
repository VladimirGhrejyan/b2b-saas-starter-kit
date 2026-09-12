import type {UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Entity} from '../shared-kernel/entity'

import type {LocalPasswordReconstituteProps} from './local-password.types'

/**
 * Local password credential for a global user. The hash is opaque.
 */
export class LocalPassword extends Entity<UserId> {
  #passwordHash: string

  private constructor(userId: UserId, passwordHash: string) {
    super(userId)
    this.#passwordHash = passwordHash
  }

  get passwordHash(): string {
    return this.#passwordHash
  }

  static create(userId: UserId, passwordHash: string): LocalPassword {
    return new LocalPassword(userId, passwordHash)
  }

  static reconstitute(props: LocalPasswordReconstituteProps): LocalPassword {
    return new LocalPassword(props.userId, props.passwordHash)
  }

  replaceHash(passwordHash: string): void {
    this.#passwordHash = passwordHash
  }
}
