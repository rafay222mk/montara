import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdminSettings1787610000000 implements MigrationInterface {
  name = 'AdminSettings1787610000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" 
       ADD COLUMN IF NOT EXISTS "logoUrl" character varying(255),
       ADD COLUMN IF NOT EXISTS "phone" character varying(50),
       ADD COLUMN IF NOT EXISTS "email" character varying(255),
       ADD COLUMN IF NOT EXISTS "address" text,
       ADD COLUMN IF NOT EXISTS "timezone" character varying(100),
       ADD COLUMN IF NOT EXISTS "currency" character varying(20),
       ADD COLUMN IF NOT EXISTS "academicYear" character varying(50)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" 
       DROP COLUMN IF EXISTS "logoUrl",
       DROP COLUMN IF EXISTS "phone",
       DROP COLUMN IF EXISTS "email",
       DROP COLUMN IF EXISTS "address",
       DROP COLUMN IF EXISTS "timezone",
       DROP COLUMN IF EXISTS "currency",
       DROP COLUMN IF EXISTS "academicYear"`
    );
  }
}
