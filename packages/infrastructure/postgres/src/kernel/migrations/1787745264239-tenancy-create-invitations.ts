import type {MigrationInterface, QueryRunner} from 'typeorm'

export class TenancyCreateInvitations1787745264239 implements MigrationInterface {
  name = 'TenancyCreateInvitations1787745264239'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "invitations" ("id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "email" text NOT NULL, "token_hash" text NOT NULL, "expires_at" timestamptz NOT NULL, "invited_by_user_id" uuid NOT NULL, "consumed_at" timestamptz, CONSTRAINT "uq_invitations_token_hash" UNIQUE ("token_hash"), CONSTRAINT "PK_invitations_id" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_invitations_pending_tenant_email" ON "invitations" ("tenant_id", "email") WHERE "consumed_at" IS NULL`,
    )
    await queryRunner.query(
      `CREATE TABLE "invitation_roles" ("invitation_id" uuid NOT NULL, "role_id" uuid NOT NULL, CONSTRAINT "PK_invitation_roles" PRIMARY KEY ("invitation_id", "role_id"))`,
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "invitation_roles"`)
    await queryRunner.query(`DROP INDEX "public"."uq_invitations_pending_tenant_email"`)
    await queryRunner.query(`DROP TABLE "invitations"`)
  }
}
