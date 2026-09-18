import type {MigrationInterface, QueryRunner} from 'typeorm'

export class KernelCreateIdempotencyKeys1787745264244 implements MigrationInterface {
  name = 'KernelCreateIdempotencyKeys1787745264244'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "idempotency_keys" (
        "id" uuid NOT NULL,
        "scope" text NOT NULL,
        "endpoint" text NOT NULL,
        "idempotency_key" text NOT NULL,
        "request_fingerprint" text NOT NULL,
        "status" text NOT NULL,
        "response_status" integer,
        "response_body" jsonb,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "tenant_id" uuid,
        "actor_id" uuid,
        "created_at" TIMESTAMPTZ NOT NULL,
        "updated_at" TIMESTAMPTZ NOT NULL,
        CONSTRAINT "PK_idempotency_keys_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_idempotency_keys_scope_endpoint_key" UNIQUE ("scope", "endpoint", "idempotency_key")
      )
    `)
    await queryRunner.query(`
      CREATE INDEX "idx_idempotency_keys_expires_at" ON "idempotency_keys" ("expires_at")
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_idempotency_keys_expires_at"`)
    await queryRunner.query(`DROP TABLE "idempotency_keys"`)
  }
}
