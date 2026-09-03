import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1787570243204 implements MigrationInterface {
    name = 'InitialSchema1787570243204'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."fee_structures_frequency_enum" AS ENUM('MONTHLY', 'QUARTERLY', 'SEMESTER', 'YEARLY', 'ONE_TIME')`);
        await queryRunner.query(`CREATE TABLE "fee_structures" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "amount" numeric(10,2) NOT NULL, "frequency" "public"."fee_structures_frequency_enum" NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d634078deb9cf5ceb5788ad9b53" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_6404899e78c7ecd46aa4ade8af" ON "fee_structures" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f1383f08e24ebfd5f15a154692" ON "fee_structures" ("isActive") `);
        await queryRunner.query(`CREATE TYPE "public"."student_fees_status_enum" AS ENUM('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'WAIVED')`);
        await queryRunner.query(`CREATE TABLE "student_fees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "studentId" uuid NOT NULL, "feeStructureId" uuid NOT NULL, "amount" numeric(10,2) NOT NULL, "dueDate" date NOT NULL, "status" "public"."student_fees_status_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a2cec5273eddb36c724e226cf13" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c11fdf63eb6446b21a89458abb" ON "student_fees" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a63f486c4c8249ac8d72e17f9e" ON "student_fees" ("studentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ce8ac9ee99d69cb88ddd2ca586" ON "student_fees" ("dueDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_f4fd71aaf736ff321150189a2a" ON "student_fees" ("status") `);
        await queryRunner.query(`CREATE TYPE "public"."payments_paymentmethod_enum" AS ENUM('CASH', 'BANK_TRANSFER', 'CARD', 'ONLINE')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "studentId" uuid NOT NULL, "studentFeeId" uuid NOT NULL, "amount" numeric(10,2) NOT NULL, "paymentDate" date NOT NULL, "paymentMethod" "public"."payments_paymentmethod_enum" NOT NULL, "reference" character varying(255), "notes" text, "receivedById" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_98a04cdcbac4f6a2c55c7d1935" ON "payments" ("tenantId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b2731e10aef7f886a08c552290" ON "payments" ("studentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9458a6908dc787001c11c3821e" ON "payments" ("studentFeeId") `);
        await queryRunner.query(`CREATE INDEX "IDX_27faf14e8959f0e40d7b722dc0" ON "payments" ("paymentDate") `);
        await queryRunner.query(`ALTER TABLE "fee_structures" ADD CONSTRAINT "FK_6404899e78c7ecd46aa4ade8afd" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_fees" ADD CONSTRAINT "FK_c11fdf63eb6446b21a89458abb8" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_fees" ADD CONSTRAINT "FK_a63f486c4c8249ac8d72e17f9e1" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_fees" ADD CONSTRAINT "FK_50d9250258fc82d894874e58f15" FOREIGN KEY ("feeStructureId") REFERENCES "fee_structures"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_98a04cdcbac4f6a2c55c7d19350" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_b2731e10aef7f886a08c552290e" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_9458a6908dc787001c11c3821ec" FOREIGN KEY ("studentFeeId") REFERENCES "student_fees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_5b988c4b38ca40d7bdf43a7af97" FOREIGN KEY ("receivedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_5b988c4b38ca40d7bdf43a7af97"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_9458a6908dc787001c11c3821ec"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_b2731e10aef7f886a08c552290e"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_98a04cdcbac4f6a2c55c7d19350"`);
        await queryRunner.query(`ALTER TABLE "student_fees" DROP CONSTRAINT "FK_50d9250258fc82d894874e58f15"`);
        await queryRunner.query(`ALTER TABLE "student_fees" DROP CONSTRAINT "FK_a63f486c4c8249ac8d72e17f9e1"`);
        await queryRunner.query(`ALTER TABLE "student_fees" DROP CONSTRAINT "FK_c11fdf63eb6446b21a89458abb8"`);
        await queryRunner.query(`ALTER TABLE "fee_structures" DROP CONSTRAINT "FK_6404899e78c7ecd46aa4ade8afd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_27faf14e8959f0e40d7b722dc0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9458a6908dc787001c11c3821e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b2731e10aef7f886a08c552290"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_98a04cdcbac4f6a2c55c7d1935"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_paymentmethod_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f4fd71aaf736ff321150189a2a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ce8ac9ee99d69cb88ddd2ca586"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a63f486c4c8249ac8d72e17f9e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c11fdf63eb6446b21a89458abb"`);
        await queryRunner.query(`DROP TABLE "student_fees"`);
        await queryRunner.query(`DROP TYPE "public"."student_fees_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f1383f08e24ebfd5f15a154692"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6404899e78c7ecd46aa4ade8af"`);
        await queryRunner.query(`DROP TABLE "fee_structures"`);
        await queryRunner.query(`DROP TYPE "public"."fee_structures_frequency_enum"`);
    }

}
