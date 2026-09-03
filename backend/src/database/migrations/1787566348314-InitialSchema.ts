import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1787566348314 implements MigrationInterface {
    name = 'InitialSchema1787566348314'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."attendance_status_enum" AS ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')`);
        await queryRunner.query(`CREATE TABLE "attendance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "studentId" uuid NOT NULL, "classroomId" uuid NOT NULL, "tenantId" uuid NOT NULL, "date" date NOT NULL, "status" "public"."attendance_status_enum" NOT NULL, "remarks" text, "markedById" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e4f48bddca35c7d08098ed2d431" UNIQUE ("studentId", "date"), CONSTRAINT "PK_ee0ffe42c1f1a01e72b725c0cb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3916813c1eb0e44c0cff3f43e6" ON "attendance" ("tenantId", "date") `);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_120e1c6edcec4f8221f467c8039" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_346d2cf918654d1b17e6309d8ff" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_180d196307c19bf2f3adcf04dc6" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_484d17e393ef8318b8a6abf0eef" FOREIGN KEY ("markedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_484d17e393ef8318b8a6abf0eef"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_180d196307c19bf2f3adcf04dc6"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_346d2cf918654d1b17e6309d8ff"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_120e1c6edcec4f8221f467c8039"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3916813c1eb0e44c0cff3f43e6"`);
        await queryRunner.query(`DROP TABLE "attendance"`);
        await queryRunner.query(`DROP TYPE "public"."attendance_status_enum"`);
    }

}
