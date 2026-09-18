import {Inject, Injectable} from '@nestjs/common'

import type {MembershipRepository} from '@b2b-saas-starter-kit/domain'
import {MEMBERSHIP_REPOSITORY} from '@b2b-saas-starter-kit/domain'

import {ActiveMembershipRequiredError} from '../errors/active-membership-required.error'

import type {SelectTenantCommand, SelectTenantResult} from './select-tenant.types'

/**
 * Confirms an active membership before the edge re-issues an access token with `tid`.
 */
@Injectable()
export class SelectTenantUseCase {
  constructor(@Inject(MEMBERSHIP_REPOSITORY) private readonly memberships: MembershipRepository) {}

  async execute(command: SelectTenantCommand): Promise<SelectTenantResult> {
    const membership = await this.memberships.findByUserAndTenant(command.userId, command.tenantId)

    if (membership === null || membership.status !== 'active') {
      throw new ActiveMembershipRequiredError()
    }

    return {userId: command.userId, tenantId: command.tenantId}
  }
}
