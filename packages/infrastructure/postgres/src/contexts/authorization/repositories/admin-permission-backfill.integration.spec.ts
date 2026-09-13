import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {RoleId, TenantId} from '@b2b-saas-starter-kit/shared-kernel-types'

import {PostgresTestContext} from '../../../testing/postgres-test-context'

const tenantId = TenantId.parse('11111111-1111-4111-8111-111111111111')
const adminRoleId = RoleId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')

describe('Admin permission backfill', () => {
  let ctx: PostgresTestContext

  beforeAll(async () => {
    ctx = await PostgresTestContext.connect()
  })

  afterAll(async () => {
    await ctx?.destroy()
  })

  beforeEach(async () => {
    await ctx.truncateFoundationTables()
  })

  it('inserts invite and manage onto existing system Admin roles', async () => {
    await ctx.dataSource.query(`INSERT INTO roles (id, tenant_id, name, is_system) VALUES ($1, $2, 'Admin', true)`, [
      adminRoleId,
      tenantId,
    ])
    await ctx.dataSource.query(
      `INSERT INTO role_permissions (role_id, permission) VALUES ($1, 'tenancy.members.read')`,
      [adminRoleId],
    )

    await ctx.dataSource.query(`
      INSERT INTO role_permissions (role_id, permission)
      SELECT r.id, p.permission
      FROM roles r
      CROSS JOIN (
        VALUES
          ('tenancy.members.invite'),
          ('tenancy.members.manage')
      ) AS p(permission)
      WHERE r.is_system = true
        AND r.name = 'Admin'
        AND NOT EXISTS (
          SELECT 1
          FROM role_permissions rp
          WHERE rp.role_id = r.id
            AND rp.permission = p.permission
        )
    `)

    const rows = await ctx.dataSource.query<{permission: string}[]>(
      'SELECT permission FROM role_permissions WHERE role_id = $1 ORDER BY permission',
      [adminRoleId],
    )

    expect(rows.map((row) => row.permission)).toEqual([
      'tenancy.members.invite',
      'tenancy.members.manage',
      'tenancy.members.read',
    ])
  })
})
