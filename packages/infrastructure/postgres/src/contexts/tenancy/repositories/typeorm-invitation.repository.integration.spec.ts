import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {
  InvitationId,
  RoleId,
  TenantId,
  TenantStatus,
  userActor,
  UserId,
} from '@b2b-saas-starter-kit/shared-kernel-types'

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

    await tenantContext.run({tenantId: tenantA, actor: userActor(actorA)}, async () =>
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
    const pending = await tenantContext.run({tenantId: tenantA, actor: userActor(actorA)}, async () =>
      repo.findActiveByTenantAndEmail(tenantA, 'ada@example.com'),
    )

    expect(found?.id).toBe(invitationId)
    expect(found?.roleIds).toEqual([roleId])
    expect(pending?.id).toBe(invitationId)
  })

  it('deleteStale removes expired and consumed invitations including role rows', async () => {
    const expiredId = InvitationId.parse('77777777-7777-4777-8777-777777777777')
    const consumedId = InvitationId.parse('66666666-6666-4666-8666-666666666666')
    const activeId = InvitationId.parse('55555555-5555-4555-8555-555555555555')

    await tenantContext.run({tenantId: tenantA, actor: userActor(actorA)}, async () =>
      runInUnitOfWork(ctx.dataSource, async () => {
        await repo.save(
          Invitation.create(
            activeId,
            tenantA,
            'ada@example.com',
            [roleId],
            'active-hash',
            new Date('2026-03-01T00:00:00.000Z'),
            actorA,
            occurredAt,
          ),
        )
        await repo.save(
          Invitation.create(
            expiredId,
            tenantA,
            'mel@example.com',
            [roleId],
            'expired-hash',
            new Date('2025-12-01T00:00:00.000Z'),
            actorA,
            occurredAt,
          ),
        )

        const consumed = Invitation.create(
          consumedId,
          tenantA,
          'eve@example.com',
          [roleId],
          'consumed-hash',
          new Date('2026-03-01T00:00:00.000Z'),
          actorA,
          occurredAt,
        )

        consumed.consume(occurredAt)
        await repo.save(consumed)
      }),
    )

    let deleted = 0

    await runInUnitOfWork(ctx.dataSource, async () => {
      deleted = await repo.deleteStale(occurredAt, 500)
    })

    expect(deleted).toBe(2)
    await expect(
      tenantContext.run({tenantId: tenantA, actor: userActor(actorA)}, async () => repo.findById(activeId)),
    ).resolves.toMatchObject({id: activeId})
    await expect(repo.findByTokenHash('expired-hash')).resolves.toBeNull()
    await expect(repo.findByTokenHash('consumed-hash')).resolves.toBeNull()

    const roleRows = await ctx.dataSource.query<{invitation_id: string}[]>('SELECT invitation_id FROM invitation_roles')

    expect(roleRows).toEqual([{invitation_id: activeId}])
  })
})
