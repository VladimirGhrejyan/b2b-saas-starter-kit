import type {MigrationInterface, QueryRunner} from 'typeorm'

export class IdentityCreateCredentials1787745264238 implements MigrationInterface {
  name = 'IdentityCreateCredentials1787745264238'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_local_passwords" ("user_id" uuid NOT NULL, "password_hash" text NOT NULL, CONSTRAINT "PK_user_local_passwords" PRIMARY KEY ("user_id"))`,
    )
    await queryRunner.query(
      `CREATE TABLE "refresh_sessions" ("id" uuid NOT NULL, "user_id" uuid NOT NULL, "family_id" uuid NOT NULL, "token_hash" text NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_refresh_sessions_token_hash" UNIQUE ("token_hash"), CONSTRAINT "PK_refresh_sessions" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_refresh_sessions_family_id" ON "refresh_sessions" ("family_id")`)
    await queryRunner.query(`CREATE INDEX "IDX_refresh_sessions_user_id" ON "refresh_sessions" ("user_id")`)
    await queryRunner.query(
      `CREATE TABLE "password_reset_tokens" ("user_id" uuid NOT NULL, "token_hash" text NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "consumed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_password_reset_tokens_token_hash" UNIQUE ("token_hash"), CONSTRAINT "PK_password_reset_tokens" PRIMARY KEY ("user_id"))`,
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`)
    await queryRunner.query(`DROP TABLE "refresh_sessions"`)
    await queryRunner.query(`DROP TABLE "user_local_passwords"`)
  }
}
