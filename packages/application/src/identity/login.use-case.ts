import {Injectable} from '@nestjs/common'

import {RefreshFamilyId, RefreshSessionId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {
  LocalPasswordRepository,
  MembershipRepository,
  RefreshSessionRepository,
  UserRepository,
} from '@b2b-saas-starter-kit/domain'
import {RefreshSession} from '@b2b-saas-starter-kit/domain'

import type {Clock, IdGenerator, PasswordHasher, TokenDigest, UnitOfWork} from '@b2b-saas-starter-kit/platform'

import {InvalidCredentialsError} from './errors/invalid-credentials.error'
import {UserSuspendedError} from './errors/user-suspended.error'
import {REFRESH_TTL_MS} from './authentication.constants'
import type {LoginCommand, LoginResult} from './login.types'

/**
 * Verifies a local password and issues a refresh-token family.
 */
@Injectable()
export class LoginUseCase {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly hasher: PasswordHasher,
    private readonly digest: TokenDigest,
    private readonly users: UserRepository,
    private readonly passwords: LocalPasswordRepository,
    private readonly sessions: RefreshSessionRepository,
    private readonly memberships: MembershipRepository,
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
