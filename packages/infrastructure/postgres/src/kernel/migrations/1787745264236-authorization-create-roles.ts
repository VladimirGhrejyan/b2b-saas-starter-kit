import type {MigrationInterface, QueryRunner} from 'typeorm'

export class AuthorizationCreateRoles1787745264236 implements MigrationInterface {
  name = 'AuthorizationCreateRoles1787745264236'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "name" text NOT NULL, "is_system" boolean NOT NULL, CONSTRAINT "uq_roles_tenant_id_name" UNIQUE ("tenant_id", "name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "role_permissions" ("role_id" uuid NOT NULL, "permission" text NOT NULL, CONSTRAINT "PK_0167acb6e0ccfcf0c6c140cec4a" PRIMARY KEY ("role_id", "permission"))`,
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "role_permissions"`)
    await queryRunner.query(`DROP TABLE "roles"`)
  }
}
