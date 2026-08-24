import {Injectable} from '@nestjs/common'

import type {MembershipRepository, UserRepository} from '@b2b-saas-starter-kit/domain'

import type {AuthorizationPort} from '../shared/authorization.port'

import {UserNotFoundError} from './errors/user-not-found.error'
import type {GetMyProfileQueryInput, GetMyProfileResult} from './get-my-profile.types'

/**
 * Self-read: actor profile, active-tenant membership, and effective permissions.
 */
@Injectable()
export class GetMyProfileQuery {
  constructor(
    private readonly users: UserRepository,
    private readonly memberships: MembershipRepository,
    private readonly authz: AuthorizationPort,
  ) {}

  async execute(query: GetMyProfileQueryInput): Promise<GetMyProfileResult> {
    const user = await this.users.findById(query.actorId)

    if (user === null) {
      throw new UserNotFoundError()
    }

    const membership = await this.memberships.findByUserAndTenant(query.actorId, query.tenantId)
    const effectivePermissions = await this.authz.getEffectivePermissions(query.actorId, query.tenantId)

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
      },
      membership:
        membership === null
          ? null
          : {
              membershipId: membership.id,
              tenantId: membership.tenantId,
              roleIds: membership.roleIds,
              status: membership.status,
            },
      effectivePermissions,
    }
  }
}
