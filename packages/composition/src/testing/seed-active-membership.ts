import type {INestApplication} from '@nestjs/common'

import {MembershipId} from '@b2b-saas-starter-kit/shared-kernel-types'

import type {MembershipRepository} from '@b2b-saas-starter-kit/domain'
import {Membership, MEMBERSHIP_REPOSITORY} from '@b2b-saas-starter-kit/domain'

import type {Clock, IdGenerator, TenantContext, UnitOfWork} from '@b2b-saas-starter-kit/platform'
import {CLOCK, ID_GENERATOR, TENANT_CONTEXT, UNIT_OF_WORK} from '@b2b-saas-starter-kit/platform'

import type {SeedActiveMembershipInput, SeedActiveMembershipResult} from './seed-active-membership.types'

/**
 * Attaches an active membership (invitations are deferred). Runs inside `withoutTenantScope`.
 */
export async function seedActiveMembership(
  app: INestApplication,
  input: SeedActiveMembershipInput,
): Promise<SeedActiveMembershipResult> {
  const memberships = app.get<MembershipRepository>(MEMBERSHIP_REPOSITORY)
  const tenantContext = app.get<TenantContext>(TENANT_CONTEXT)
  const uow = app.get<UnitOfWork>(UNIT_OF_WORK)
  const ids = app.get<IdGenerator>(ID_GENERATOR)
  const clock = app.get<Clock>(CLOCK)
  const membershipId = MembershipId.parse(ids.generate())

  await tenantContext.withoutTenantScope(async () => {
    await uow.run(async () => {
      const membership = Membership.create(membershipId, input.tenantId, input.userId, [input.roleId], clock.now())

      await memberships.save(membership)
    })
  })

  return {membershipId}
}
