import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {InvitationId, RoleId, TenantId, TenantStatus, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {Invitation, Tenant} from '@b2b-saas-starter-kit/domain'

import {AlsTenantContext} from '../../../kernel/tenant-context/tenant-context'
import {PostgresTestContext} from '../../../testing/postgres-test-context'
import {runInUnitOfWork} from '../../../testing/run-in-unit-of-work'

import {TypeOrmInvitationRepository} from './typeorm-invitation.repository'
import {TypeOrmTenantRepository} from './typeorm-tenant.repository'

const tenantA = TenantId.parse('11111111-1111-4111-8111-111111111111')
const actorA = UserId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const invitationId = InvitationId.parse('99999999-9999-4999-8999-999999999999')
const roleId = RoleId.parse('88888888-8888-4888-8888-888888888888')
const occurredAt = new Date('2026-01-01T00:00:00.000Z')
const rawToken = 'raw-invitation-token'
const tokenHash = 'hashed-token-value'

describe('TypeOrmInvitationRepository', () => {
  let ctx: PostgresTestContext
  let tenantContext: AlsTenantContext
  let repo: TypeOrmInvitationRepository

  beforeAll(async () => {
    ctx = await PostgresTestContext.connect()
    tenantContext = new AlsTenantContext()
    const tenants = new TypeOrmTenantRepository(ctx.dataSource, tenantContext)

    repo = new TypeOrmInvitationRepository(ctx.dataSource, tenantContext)

    await ctx.truncateFoundationTables()
    await tenantContext.withoutTenantScope(async () => {
      await tenants.save(Tenant.reconstitute({id: tenantA, name: 'Acme', status: TenantStatus.parse('active')}))
    })
  })

  afterAll(async () => {
    await ctx?.destroy()
  })

  beforeEach(async () => {
    await ctx.dataSource.query('TRUNCATE invitation_roles, invitations RESTART IDENTITY CASCADE')
  })

  it('persists the token hash and never stores the raw token', async () => {
    const invitation = Invitation.create(
      invitationId,
      tenantA,
      'ada@example.com',
      [roleId],
      tokenHash,
      new Date('2026-01-08T00:00:00.000Z'),
      actorA,
      occurredAt,
    )

    await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () =>
      runInUnitOfWork(ctx.dataSource, async () => {
        await repo.save(invitation)
      }),
    )

    const rows = await ctx.dataSource.query<{token_hash: string; email: string}[]>(
      'SELECT token_hash, email FROM invitations WHERE id = $1',
      [invitationId],
    )

    expect(rows).toHaveLength(1)
    expect(rows[0]?.token_hash).toBe(tokenHash)
    expect(JSON.stringify(rows)).not.toContain(rawToken)

    const found = await repo.findByTokenHash(tokenHash)
    const pending = await tenantContext.run({tenantId: tenantA, actorId: actorA}, async () =>
      repo.findActiveByTenantAndEmail(tenantA, 'ada@example.com'),
    )

    expect(found?.id).toBe(invitationId)
    expect(found?.roleIds).toEqual([roleId])
    expect(pending?.id).toBe(invitationId)
  })
})
