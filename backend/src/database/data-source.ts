import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Classroom } from '../classrooms/entities/classroom.entity';
import { Student } from '../students/entities/student.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Observation } from '../observations/entities/observation.entity';
import { Assessment } from '../assessments/entities/assessment.entity';
import { FeeStructure } from '../finance/entities/fee-structure.entity';
import { StudentFee } from '../finance/entities/student-fee.entity';
import { Payment } from '../finance/entities/payment.entity';
import { CurriculumLesson } from '../curriculum/entities/curriculum-lesson.entity';
import { LessonPlan } from '../curriculum/entities/lesson-plan.entity';
import { StudentPoints } from '../gamification/entities/student-points.entity';
import { Badge } from '../gamification/entities/badge.entity';
import { StudentBadge } from '../gamification/entities/student-badge.entity';
import { Employee } from '../hr/entities/employee.entity';
import { LeaveRequest } from '../hr/entities/leave-request.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { InventoryTransaction } from '../inventory/entities/inventory-transaction.entity';
import { Announcement } from '../communication/entities/announcement.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,

  entities: [
    User, Tenant, Classroom, Student, Attendance, Observation, Assessment,
    FeeStructure, StudentFee, Payment, CurriculumLesson, LessonPlan,
    StudentPoints, Badge, StudentBadge, Employee, LeaveRequest,
    InventoryItem, InventoryTransaction, Announcement
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],

  synchronize: false,
});