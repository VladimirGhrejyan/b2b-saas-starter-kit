import type {MigrationInterface, QueryRunner} from 'typeorm'

export class IdentityCreateUsers1787745264235 implements MigrationInterface {
  name = 'IdentityCreateUsers1787745264235'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL, "email" text NOT NULL, "display_name" text NOT NULL, "status" text NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`)
  }
}
