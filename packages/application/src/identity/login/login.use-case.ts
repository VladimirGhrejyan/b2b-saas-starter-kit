import {Inject, Injectable} from '@nestjs/common'

import {RefreshFamilyId, RefreshSessionId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {
  LocalPasswordRepository,
  MembershipRepository,
  RefreshSessionRepository,
  UserRepository,
} from '@b2b-saas-starter-kit/domain'
import {
  LOCAL_PASSWORD_REPOSITORY,
  MEMBERSHIP_REPOSITORY,
  REFRESH_SESSION_REPOSITORY,
  RefreshSession,
  USER_REPOSITORY,
} from '@b2b-saas-starter-kit/domain'

import type {Clock, IdGenerator, PasswordHasher, TokenDigest, UnitOfWork} from '@b2b-saas-starter-kit/platform'
import {CLOCK, ID_GENERATOR, PASSWORD_HASHER, TOKEN_DIGEST, UNIT_OF_WORK} from '@b2b-saas-starter-kit/platform'

import {REFRESH_TTL_MS} from '../authentication.constants'
import {InvalidCredentialsError} from '../errors/invalid-credentials.error'
import {UserSuspendedError} from '../errors/user-suspended.error'

import type {LoginCommand, LoginResult} from './login.types'

/**
 * Verifies a local password and issues a refresh-token family.
 */
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(UNIT_OF_WORK) private readonly uow: UnitOfWork,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ID_GENERATOR) private readonly ids: IdGenerator,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_DIGEST) private readonly digest: TokenDigest,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(LOCAL_PASSWORD_REPOSITORY) private readonly passwords: LocalPasswordRepository,
    @Inject(REFRESH_SESSION_REPOSITORY) private readonly sessions: RefreshSessionRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    return this.uow.run(async () => {
      const user = await this.users.findByEmail(command.email.trim().toLowerCase())
      const credential = user === null ? null : await this.passwords.findByUserId(user.id)
      const matches = credential === null ? false : await this.hasher.verify(command.password, credential.passwordHash)

      if (user === null || credential === null || !matches) {
        throw new InvalidCredentialsError()
      }

      if (user.status === 'suspended') {
        throw new UserSuspendedError()
      }

      const now = this.clock.now()
      const refreshToken = this.ids.generate()
      const session = RefreshSession.create(
        RefreshSessionId.parse(this.ids.generate()),
        user.id,
        RefreshFamilyId.parse(this.ids.generate()),
        this.digest.digest(refreshToken),
        new Date(now.getTime() + REFRESH_TTL_MS),
      )

      await this.sessions.save(session)

      const activeMemberships = (await this.memberships.findByUser(user.id)).filter(
        (membership) => membership.status === 'active',
      )

      return {
        userId: user.id,
        tenantId: activeMemberships.length === 1 ? activeMemberships[0]?.tenantId : undefined,
        refreshToken,
      }
    })
  }
}
