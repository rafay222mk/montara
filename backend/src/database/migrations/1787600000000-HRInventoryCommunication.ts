import { MigrationInterface, QueryRunner } from 'typeorm';

export class HRInventoryCommunication1787600000000 implements MigrationInterface {
  name = 'HRInventoryCommunication1787600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create Enums
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "public"."employees_employmenttype_enum" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`
    );
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "public"."employees_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'ON_LEAVE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`
    );
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "public"."leave_requests_leavetype_enum" AS ENUM('SICK', 'CASUAL', 'ANNUAL');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`
    );
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "public"."leave_requests_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`
    );
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "public"."inventory_items_status_enum" AS ENUM('ACTIVE', 'INACTIVE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`
    );
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "public"."inventory_transactions_type_enum" AS ENUM('STOCK_IN', 'STOCK_OUT');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`
    );
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "public"."announcements_audience_enum" AS ENUM('ALL', 'TEACHERS', 'PARENTS', 'ADMINS');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`
    );
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "public"."announcements_priority_enum" AS ENUM('NORMAL', 'IMPORTANT', 'URGENT');
      EXCEPTION WHEN duplicate_object THEN null; END $$;`
    );

    // 2. Create tables
    // Employees Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "employees" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "userId" uuid,
        "employeeNumber" character varying(100) NOT NULL,
        "name" character varying(255) NOT NULL,
        "jobTitle" character varying(255) NOT NULL,
        "department" character varying(255) NOT NULL,
        "employmentType" "public"."employees_employmenttype_enum" NOT NULL DEFAULT 'FULL_TIME',
        "hireDate" date NOT NULL,
        "salary" numeric(10,2) NOT NULL,
        "status" "public"."employees_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "phone" character varying(50),
        "emergencyContact" character varying(255),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_employees_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_employees_tenantId" ON "employees" ("tenantId")`);
    await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_employees_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "employees" ADD CONSTRAINT "FK_employees_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

    // Leave Requests Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "leave_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "employeeId" uuid NOT NULL,
        "leaveType" "public"."leave_requests_leavetype_enum" NOT NULL,
        "startDate" date NOT NULL,
        "endDate" date NOT NULL,
        "status" "public"."leave_requests_status_enum" NOT NULL DEFAULT 'PENDING',
        "approverId" uuid,
        "reason" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leave_requests_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_leave_requests_tenantId" ON "leave_requests" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_leave_requests_employeeId" ON "leave_requests" ("employeeId")`);
    await queryRunner.query(`ALTER TABLE "leave_requests" ADD CONSTRAINT "FK_leave_requests_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "leave_requests" ADD CONSTRAINT "FK_leave_requests_employeeId" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "leave_requests" ADD CONSTRAINT "FK_leave_requests_approverId" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

    // Inventory Items Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inventory_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "category" character varying(255) NOT NULL,
        "description" text,
        "quantity" integer NOT NULL DEFAULT 0,
        "minimumStock" integer NOT NULL DEFAULT 5,
        "unit" character varying(50) NOT NULL DEFAULT 'units',
        "location" character varying(255),
        "status" "public"."inventory_items_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inventory_items_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_inventory_items_tenantId" ON "inventory_items" ("tenantId")`);
    await queryRunner.query(`ALTER TABLE "inventory_items" ADD CONSTRAINT "FK_inventory_items_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

    // Inventory Transactions Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inventory_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "itemId" uuid NOT NULL,
        "type" "public"."inventory_transactions_type_enum" NOT NULL,
        "quantity" integer NOT NULL,
        "reason" character varying(255),
        "createdBy" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_inventory_transactions_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_inventory_transactions_tenantId" ON "inventory_transactions" ("tenantId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_inventory_transactions_itemId" ON "inventory_transactions" ("itemId")`);
    await queryRunner.query(`ALTER TABLE "inventory_transactions" ADD CONSTRAINT "FK_inventory_transactions_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "inventory_transactions" ADD CONSTRAINT "FK_inventory_transactions_itemId" FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "inventory_transactions" ADD CONSTRAINT "FK_inventory_transactions_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

    // Announcements Table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "announcements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "content" text NOT NULL,
        "audience" "public"."announcements_audience_enum" NOT NULL DEFAULT 'ALL',
        "priority" "public"."announcements_priority_enum" NOT NULL DEFAULT 'NORMAL',
        "isPublished" boolean NOT NULL DEFAULT true,
        "publishedAt" TIMESTAMP,
        "createdBy" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_announcements_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_announcements_tenantId" ON "announcements" ("tenantId")`);
    await queryRunner.query(`ALTER TABLE "announcements" ADD CONSTRAINT "FK_announcements_tenantId" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "announcements" ADD CONSTRAINT "FK_announcements_createdBy" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "announcements" DROP CONSTRAINT IF EXISTS "FK_announcements_createdBy"`);
    await queryRunner.query(`ALTER TABLE "announcements" DROP CONSTRAINT IF EXISTS "FK_announcements_tenantId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "announcements"`);

    await queryRunner.query(`ALTER TABLE "inventory_transactions" DROP CONSTRAINT IF EXISTS "FK_inventory_transactions_createdBy"`);
    await queryRunner.query(`ALTER TABLE "inventory_transactions" DROP CONSTRAINT IF EXISTS "FK_inventory_transactions_itemId"`);
    await queryRunner.query(`ALTER TABLE "inventory_transactions" DROP CONSTRAINT IF EXISTS "FK_inventory_transactions_tenantId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inventory_transactions"`);

    await queryRunner.query(`ALTER TABLE "inventory_items" DROP CONSTRAINT IF EXISTS "FK_inventory_items_tenantId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "inventory_items"`);

    await queryRunner.query(`ALTER TABLE "leave_requests" DROP CONSTRAINT IF EXISTS "FK_leave_requests_approverId"`);
    await queryRunner.query(`ALTER TABLE "leave_requests" DROP CONSTRAINT IF EXISTS "FK_leave_requests_employeeId"`);
    await queryRunner.query(`ALTER TABLE "leave_requests" DROP CONSTRAINT IF EXISTS "FK_leave_requests_tenantId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "leave_requests"`);

    await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "FK_employees_userId"`);
    await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "FK_employees_tenantId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employees"`);

    // Drop Enums
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."announcements_priority_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."announcements_audience_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."inventory_transactions_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."inventory_items_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."leave_requests_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."leave_requests_leavetype_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."employees_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."employees_employmenttype_enum"`);
  }
}
