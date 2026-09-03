import { MigrationInterface, QueryRunner } from 'typeorm';

export class GamificationTables1787590000000 implements MigrationInterface {
  name = 'GamificationTables1787590000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Badge category enum
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "public"."badges_category_enum" AS ENUM('ATTENDANCE', 'ACADEMIC', 'BEHAVIOR', 'PARTICIPATION', 'SPECIAL');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`
    );

    // Badges catalog
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "badges" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "icon" character varying(10) NOT NULL DEFAULT '🏅',
        "category" "public"."badges_category_enum" NOT NULL DEFAULT 'SPECIAL',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_badges_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_badges_tenantId" ON "badges" ("tenantId")`);
    await queryRunner.query(`ALTER TABLE "badges" ADD CONSTRAINT "FK_badges_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

    // Points log
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "gamification_points" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "studentId" uuid NOT NULL,
        "points" integer NOT NULL,
        "reason" character varying(255) NOT NULL,
        "awardedById" uuid NOT NULL,
        "awardedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_gamification_points_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_gamification_points_tenantId" ON "gamification_points" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_gamification_points_studentId" ON "gamification_points" ("studentId")`);
    await queryRunner.query(`ALTER TABLE "gamification_points" ADD CONSTRAINT "FK_gamification_points_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "gamification_points" ADD CONSTRAINT "FK_gamification_points_studentId" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "gamification_points" ADD CONSTRAINT "FK_gamification_points_awardedById" FOREIGN KEY ("awardedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);

    // Student badges
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "student_badges" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "studentId" uuid NOT NULL,
        "badgeId" uuid NOT NULL,
        "awardedById" uuid NOT NULL,
        "notes" text,
        "awardedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_student_badges_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_student_badges_tenantId" ON "student_badges" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_student_badges_studentId" ON "student_badges" ("studentId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_student_badges_badgeId" ON "student_badges" ("badgeId")`);
    await queryRunner.query(`ALTER TABLE "student_badges" ADD CONSTRAINT "FK_student_badges_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "student_badges" ADD CONSTRAINT "FK_student_badges_studentId" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "student_badges" ADD CONSTRAINT "FK_student_badges_badgeId" FOREIGN KEY ("badgeId") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "student_badges" ADD CONSTRAINT "FK_student_badges_awardedById" FOREIGN KEY ("awardedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "student_badges" DROP CONSTRAINT IF EXISTS "FK_student_badges_awardedById"`);
    await queryRunner.query(`ALTER TABLE "student_badges" DROP CONSTRAINT IF EXISTS "FK_student_badges_badgeId"`);
    await queryRunner.query(`ALTER TABLE "student_badges" DROP CONSTRAINT IF EXISTS "FK_student_badges_studentId"`);
    await queryRunner.query(`ALTER TABLE "student_badges" DROP CONSTRAINT IF EXISTS "FK_student_badges_tenantId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "student_badges"`);

    await queryRunner.query(`ALTER TABLE "gamification_points" DROP CONSTRAINT IF EXISTS "FK_gamification_points_awardedById"`);
    await queryRunner.query(`ALTER TABLE "gamification_points" DROP CONSTRAINT IF EXISTS "FK_gamification_points_studentId"`);
    await queryRunner.query(`ALTER TABLE "gamification_points" DROP CONSTRAINT IF EXISTS "FK_gamification_points_tenantId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "gamification_points"`);

    await queryRunner.query(`ALTER TABLE "badges" DROP CONSTRAINT IF EXISTS "FK_badges_tenantId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "badges"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."badges_category_enum"`);
  }
}
