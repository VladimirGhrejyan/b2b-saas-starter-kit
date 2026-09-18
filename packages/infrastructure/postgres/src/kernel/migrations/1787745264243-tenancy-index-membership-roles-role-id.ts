import type {MigrationInterface, QueryRunner} from 'typeorm'

export class TenancyIndexMembershipRolesRoleId1787745264243 implements MigrationInterface {
  name = 'TenancyIndexMembershipRolesRoleId1787745264243'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX "IDX_membership_roles_role_id" ON "membership_roles" ("role_id")`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_membership_roles_role_id"`)
  }
}
