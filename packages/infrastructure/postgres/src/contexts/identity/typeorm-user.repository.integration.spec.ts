import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {TenantId, UserId, UserStatus} from '@b2b-saas-starter-kit/shared-kernel-types'

import {User} from '@b2b-saas-starter-kit/domain'

import {AlsTenantContext} from '../../kernel/tenant-context/tenant-context'
import {PostgresTestContext} from '../../testing/postgres-test-context'

import {TypeOrmUserRepository} from './typeorm-user.repository'

const adaId = UserId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const melId = UserId.parse('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')

describe('TypeOrmUserRepository', () => {
  let ctx: PostgresTestContext
  let repo: TypeOrmUserRepository

  beforeAll(async () => {
    ctx = await PostgresTestContext.connect()
    repo = new TypeOrmUserRepository(ctx.dataSource)
  })

  afterAll(async () => {
    await ctx?.destroy()
  })

  beforeEach(async () => {
    await ctx.truncateFoundationTables()
  })

  it('round-trips save, findById, and findByEmail without tenant scope', async () => {
    const user = User.reconstitute({
      id: adaId,
      email: 'ada@example.com',
      displayName: 'Ada',
      status: UserStatus.parse('active'),
    })

    await repo.save(user)

    expect(await repo.findById(adaId)).toMatchObject({
      id: adaId,
      email: 'ada@example.com',
      displayName: 'Ada',
      status: 'active',
    })
    expect(await repo.findByEmail('Ada@example.com')).toMatchObject({id: adaId})
  })

  it('upserts on save and rejects a second user with the same email', async () => {
    await repo.save(
      User.reconstitute({
        id: adaId,
        email: 'ada@example.com',
        displayName: 'Ada',
        status: UserStatus.parse('active'),
      }),
    )
    await repo.save(
      User.reconstitute({
        id: adaId,
        email: 'ada@example.com',
        displayName: 'Ada Lovelace',
        status: UserStatus.parse('active'),
      }),
    )

    expect(await repo.findById(adaId)).toMatchObject({displayName: 'Ada Lovelace'})

    await expect(
      repo.save(
        User.reconstitute({
          id: melId,
          email: 'ada@example.com',
          displayName: 'Mel',
          status: UserStatus.parse('active'),
        }),
      ),
    ).rejects.toThrow()
  })

  it('finds users while a tenant scope is active', async () => {
    const tenantContext = new AlsTenantContext()

    await repo.save(
      User.reconstitute({
        id: adaId,
        email: 'ada@example.com',
        displayName: 'Ada',
        status: UserStatus.parse('active'),
      }),
    )

    const found = await tenantContext.run(
      {
        tenantId: TenantId.parse('11111111-1111-4111-8111-111111111111'),
        actorId: adaId,
      },
      async () => repo.findByEmail('ada@example.com'),
    )

    expect(found?.id).toBe(adaId)
  })
})
