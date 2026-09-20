import type {MigrationInterface, QueryRunner} from 'typeorm'

export class IdentityCreateApiKeys1787745264245 implements MigrationInterface {
  name = 'IdentityCreateApiKeys1787745264245'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "api_keys" (
        "id" uuid NOT NULL,
        "tenant_id" uuid NOT NULL,
        "created_by_user_id" uuid NOT NULL,
        "name" text NOT NULL,
        "prefix" text NOT NULL,
        "secret_hash" text NOT NULL,
        "permissions" text[] NOT NULL,
        "expires_at" timestamptz,
        "revoked_at" timestamptz,
        "last_used_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_api_keys_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_api_keys_prefix" UNIQUE ("prefix"),
        CONSTRAINT "uq_api_keys_secret_hash" UNIQUE ("secret_hash")
      )
    `)
    await queryRunner.query(`
      CREATE INDEX "idx_api_keys_tenant_id" ON "api_keys" ("tenant_id")
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_api_keys_tenant_id"`)
    await queryRunner.query(`DROP TABLE "api_keys"`)
  }
}
