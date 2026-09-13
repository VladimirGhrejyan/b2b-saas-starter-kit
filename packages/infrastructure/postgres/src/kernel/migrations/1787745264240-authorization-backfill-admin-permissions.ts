import type {MigrationInterface, QueryRunner} from 'typeorm'

export class AuthorizationBackfillAdminPermissions1787745264240 implements MigrationInterface {
  name = 'AuthorizationBackfillAdminPermissions1787745264240'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission")
      SELECT r.id, p.permission
      FROM "roles" r
      CROSS JOIN (
        VALUES
          ('tenancy.members.invite'),
          ('tenancy.members.manage')
      ) AS p(permission)
      WHERE r.is_system = true
        AND r.name = 'Admin'
        AND NOT EXISTS (
          SELECT 1
          FROM "role_permissions" rp
          WHERE rp.role_id = r.id
            AND rp.permission = p.permission
        )
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions" rp
      USING "roles" r
      WHERE rp.role_id = r.id
        AND r.is_system = true
        AND r.name = 'Admin'
        AND rp.permission IN ('tenancy.members.invite', 'tenancy.members.manage')
    `)
  }
}
