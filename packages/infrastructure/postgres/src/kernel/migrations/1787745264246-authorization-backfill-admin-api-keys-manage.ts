import type {MigrationInterface, QueryRunner} from 'typeorm'

export class AuthorizationBackfillAdminApiKeysManage1787745264246 implements MigrationInterface {
  name = 'AuthorizationBackfillAdminApiKeysManage1787745264246'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission")
      SELECT r.id, 'identity.api_keys.manage'
      FROM "roles" r
      WHERE r.is_system = true
        AND r.name = 'Admin'
        AND NOT EXISTS (
          SELECT 1
          FROM "role_permissions" rp
          WHERE rp.role_id = r.id
            AND rp.permission = 'identity.api_keys.manage'
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
        AND rp.permission = 'identity.api_keys.manage'
    `)
  }
}
