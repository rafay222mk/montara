import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1787567328029 implements MigrationInterface {
    name = 'InitialSchema1787567328029'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."observations_area_enum" AS ENUM('PRACTICAL_LIFE', 'SENSORIAL', 'LANGUAGE', 'MATHEMATICS', 'CULTURAL', 'ART', 'MUSIC', 'MOVEMENT', 'SOCIAL_EMOTIONAL')`);
        await queryRunner.query(`CREATE TYPE "public"."observations_progress_enum" AS ENUM('NOT_STARTED', 'INTRODUCED', 'PRACTICING', 'DEVELOPING', 'MASTERED')`);
        await queryRunner.query(`CREATE TABLE "observations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "studentId" uuid NOT NULL, "tenantId" uuid NOT NULL, "teacherId" uuid NOT NULL, "area" "public"."observations_area_enum" NOT NULL, "skill" character varying(255) NOT NULL, "notes" text NOT NULL, "progress" "public"."observations_progress_enum" NOT NULL, "observedAt" date NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f9208d64f50a76030758087c0ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b125cd5a7a76cd5458cb50b1c3" ON "observations" ("studentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_77a607d7588ada2ef6970fdd31" ON "observations" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9cdb18e111d1f09599dbb201e4" ON "observations" ("teacherId") `);
        await queryRunner.query(`CREATE INDEX "IDX_34ec29a599cceb795ae80dcd78" ON "observations" ("observedAt") `);
        await queryRunner.query(`ALTER TABLE "observations" ADD CONSTRAINT "FK_b125cd5a7a76cd5458cb50b1c33" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "observations" ADD CONSTRAINT "FK_77a607d7588ada2ef6970fdd313" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "observations" ADD CONSTRAINT "FK_9cdb18e111d1f09599dbb201e4c" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "observations" DROP CONSTRAINT "FK_9cdb18e111d1f09599dbb201e4c"`);
        await queryRunner.query(`ALTER TABLE "observations" DROP CONSTRAINT "FK_77a607d7588ada2ef6970fdd313"`);
        await queryRunner.query(`ALTER TABLE "observations" DROP CONSTRAINT "FK_b125cd5a7a76cd5458cb50b1c33"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_34ec29a599cceb795ae80dcd78"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9cdb18e111d1f09599dbb201e4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_77a607d7588ada2ef6970fdd31"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b125cd5a7a76cd5458cb50b1c3"`);
        await queryRunner.query(`DROP TABLE "observations"`);
        await queryRunner.query(`DROP TYPE "public"."observations_progress_enum"`);
        await queryRunner.query(`DROP TYPE "public"."observations_area_enum"`);
    }

}
