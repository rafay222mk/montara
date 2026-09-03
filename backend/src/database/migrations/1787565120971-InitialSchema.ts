import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1787565120971 implements MigrationInterface {
    name = 'InitialSchema1787565120971'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "students" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "dateOfBirth" date NOT NULL, "gender" character varying(20) NOT NULL, "admissionNumber" character varying(50) NOT NULL, "enrollmentDate" date NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "tenantId" uuid NOT NULL, "parentId" uuid, "classroomId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_335833de72f8106cbf1cb590ff8" UNIQUE ("tenantId", "admissionNumber"), CONSTRAINT "PK_7d7f07271ad4ce999880713f05e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_36fc75278b1436c0aba647866d" ON "students" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_0fe5a6912f421e1c2061581442" ON "students" ("tenantId") `);
        await queryRunner.query(`CREATE TABLE "classrooms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "description" text, "isActive" boolean NOT NULL DEFAULT true, "tenantId" uuid NOT NULL, "teacherId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_20b7b82896c06eda27548bd0c24" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_0fe5a6912f421e1c20615814426" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_6fea943b3b432a9e3e38d53c31b" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_e99293f4de5543838797d712b24" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "classrooms" ADD CONSTRAINT "FK_a317ff35e9ab901a57e310d20f5" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "classrooms" ADD CONSTRAINT "FK_ea22bf3c6b069755e01340f6334" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "classrooms" DROP CONSTRAINT "FK_ea22bf3c6b069755e01340f6334"`);
        await queryRunner.query(`ALTER TABLE "classrooms" DROP CONSTRAINT "FK_a317ff35e9ab901a57e310d20f5"`);
        await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_e99293f4de5543838797d712b24"`);
        await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_6fea943b3b432a9e3e38d53c31b"`);
        await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_0fe5a6912f421e1c20615814426"`);
        await queryRunner.query(`DROP TABLE "classrooms"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0fe5a6912f421e1c2061581442"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_36fc75278b1436c0aba647866d"`);
        await queryRunner.query(`DROP TABLE "students"`);
    }

}
