import type {MigrationInterface, QueryRunner} from 'typeorm'

export class TenancyCreateTenantsAndMemberships1787745264237 implements MigrationInterface {
  name = 'TenancyCreateTenantsAndMemberships1787745264237'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tenants" ("id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "name" text NOT NULL, "status" text NOT NULL, CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`CREATE INDEX "idx_tenants_tenant_id" ON "tenants" ("tenant_id")`)
    await queryRunner.query(
      `CREATE TABLE "memberships" ("id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "user_id" uuid NOT NULL, "status" text NOT NULL, CONSTRAINT "uq_memberships_tenant_id_user_id" UNIQUE ("tenant_id", "user_id"), CONSTRAINT "PK_25d28bd932097a9e90495ede7b4" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "membership_roles" ("membership_id" uuid NOT NULL, "role_id" uuid NOT NULL, CONSTRAINT "PK_9f66b1234388294e15f26799afe" PRIMARY KEY ("membership_id", "role_id"))`,
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "membership_roles"`)
    await queryRunner.query(`DROP TABLE "memberships"`)
    await queryRunner.query(`DROP INDEX "public"."idx_tenants_tenant_id"`)
    await queryRunner.query(`DROP TABLE "tenants"`)
  }
}
