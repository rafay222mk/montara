import { MigrationInterface, QueryRunner } from 'typeorm';

export class CurriculumLessonPlanning1787580000000 implements MigrationInterface {
  name = 'CurriculumLessonPlanning1787580000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "curriculum_lessons" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "area" "public"."observations_area_enum" NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text,
        "ageGroup" character varying(50) NOT NULL DEFAULT '3–6 years',
        "sequence" integer NOT NULL DEFAULT 1,
        "materialsNeeded" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_curriculum_lessons_id" PRIMARY KEY ("id")
      )`
    );

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_curriculum_lessons_tenantId" ON "curriculum_lessons" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_curriculum_lessons_area" ON "curriculum_lessons" ("area")`);

    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "public"."lesson_plans_status_enum" AS ENUM('PLANNED', 'PRESENTED', 'PRACTICING', 'MASTERED', 'DEFERRED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;`
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "lesson_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "lessonId" uuid NOT NULL,
        "classroomId" uuid,
        "studentId" uuid,
        "teacherId" uuid NOT NULL,
        "scheduledDate" date NOT NULL,
        "status" "public"."lesson_plans_status_enum" NOT NULL DEFAULT 'PLANNED',
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lesson_plans_id" PRIMARY KEY ("id")
      )`
    );

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_lesson_plans_tenantId" ON "lesson_plans" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_lesson_plans_scheduledDate" ON "lesson_plans" ("scheduledDate")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_lesson_plans_status" ON "lesson_plans" ("status")`);

    await queryRunner.query(
      `ALTER TABLE "curriculum_lessons" ADD CONSTRAINT "FK_curriculum_lessons_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "lesson_plans" ADD CONSTRAINT "FK_lesson_plans_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "lesson_plans" ADD CONSTRAINT "FK_lesson_plans_lessonId" FOREIGN KEY ("lessonId") REFERENCES "curriculum_lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "lesson_plans" ADD CONSTRAINT "FK_lesson_plans_classroomId" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "lesson_plans" ADD CONSTRAINT "FK_lesson_plans_studentId" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "lesson_plans" ADD CONSTRAINT "FK_lesson_plans_teacherId" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lesson_plans" DROP CONSTRAINT IF EXISTS "FK_lesson_plans_teacherId"`);
    await queryRunner.query(`ALTER TABLE "lesson_plans" DROP CONSTRAINT IF EXISTS "FK_lesson_plans_studentId"`);
    await queryRunner.query(`ALTER TABLE "lesson_plans" DROP CONSTRAINT IF EXISTS "FK_lesson_plans_classroomId"`);
    await queryRunner.query(`ALTER TABLE "lesson_plans" DROP CONSTRAINT IF EXISTS "FK_lesson_plans_lessonId"`);
    await queryRunner.query(`ALTER TABLE "lesson_plans" DROP CONSTRAINT IF EXISTS "FK_lesson_plans_tenantId"`);
    await queryRunner.query(`ALTER TABLE "curriculum_lessons" DROP CONSTRAINT IF EXISTS "FK_curriculum_lessons_tenantId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "lesson_plans"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."lesson_plans_status_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "curriculum_lessons"`);
  }
}
