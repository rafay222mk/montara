import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1787569582362 implements MigrationInterface {
    name = 'InitialSchema1787569582362'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."assessments_area_enum" AS ENUM('PRACTICAL_LIFE', 'SENSORIAL', 'LANGUAGE', 'MATHEMATICS', 'CULTURAL', 'ART', 'MUSIC', 'MOVEMENT', 'SOCIAL_EMOTIONAL')`);
        await queryRunner.query(`CREATE TYPE "public"."assessments_level_enum" AS ENUM('BEGINNING', 'DEVELOPING', 'PROFICIENT', 'ADVANCED')`);
        await queryRunner.query(`CREATE TABLE "assessments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "studentId" uuid NOT NULL, "tenantId" uuid NOT NULL, "teacherId" uuid NOT NULL, "area" "public"."assessments_area_enum" NOT NULL, "skill" character varying(255) NOT NULL, "level" "public"."assessments_level_enum" NOT NULL, "score" integer, "comments" text, "assessedAt" date NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3442bd80a00e9111cefca57f6c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0bedc1cc7c7242bf78246fbf4b" ON "assessments" ("studentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f918a577186968cf65f4645fbe" ON "assessments" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9c678788c729af235b440f7999" ON "assessments" ("teacherId") `);
        await queryRunner.query(`CREATE INDEX "IDX_712de3a0a7a755497cd2500ef9" ON "assessments" ("area") `);
        await queryRunner.query(`CREATE INDEX "IDX_bb20305a384204a5aed5029489" ON "assessments" ("assessedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_93b57e0fb9c7a3c7892cadd364" ON "assessments" ("studentId", "area") `);
        await queryRunner.query(`CREATE INDEX "IDX_aedfeeb0755388ebee62ba8df2" ON "assessments" ("tenantId", "assessedAt") `);
        await queryRunner.query(`ALTER TABLE "assessments" ADD CONSTRAINT "FK_0bedc1cc7c7242bf78246fbf4bd" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assessments" ADD CONSTRAINT "FK_f918a577186968cf65f4645fbe8" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assessments" ADD CONSTRAINT "FK_9c678788c729af235b440f7999b" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assessments" DROP CONSTRAINT "FK_9c678788c729af235b440f7999b"`);
        await queryRunner.query(`ALTER TABLE "assessments" DROP CONSTRAINT "FK_f918a577186968cf65f4645fbe8"`);
        await queryRunner.query(`ALTER TABLE "assessments" DROP CONSTRAINT "FK_0bedc1cc7c7242bf78246fbf4bd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aedfeeb0755388ebee62ba8df2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_93b57e0fb9c7a3c7892cadd364"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bb20305a384204a5aed5029489"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_712de3a0a7a755497cd2500ef9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9c678788c729af235b440f7999"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f918a577186968cf65f4645fbe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0bedc1cc7c7242bf78246fbf4b"`);
        await queryRunner.query(`DROP TABLE "assessments"`);
        await queryRunner.query(`DROP TYPE "public"."assessments_level_enum"`);
        await queryRunner.query(`DROP TYPE "public"."assessments_area_enum"`);
    }

}
