import {Inject, Injectable} from '@nestjs/common'

import type {TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {Membership, MembershipRepository} from '@b2b-saas-starter-kit/domain'
import {MEMBERSHIP_REPOSITORY} from '@b2b-saas-starter-kit/domain'

import type {TenantContext} from '@b2b-saas-starter-kit/platform'
import {TENANT_CONTEXT} from '@b2b-saas-starter-kit/platform'

/**
 * Looks up an active membership without requiring ambient tenant scope.
 */
@Injectable()
export class AssertActiveMembership {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository,
    @Inject(TENANT_CONTEXT) private readonly tenantContext: TenantContext,
  ) {}

  async findActive(userId: UserId, tenantId: TenantId): Promise<Membership | null> {
    const membership = await this.tenantContext.withoutTenantScope(() =>
      this.memberships.findByUserAndTenant(userId, tenantId),
    )

    if (membership === null || membership.status !== 'active') {
      return null
    }

    return membership
  }
}
