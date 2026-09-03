import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CurriculumLesson } from './curriculum-lesson.entity';
import { Classroom } from '../../classrooms/entities/classroom.entity';
import { Student } from '../../students/entities/student.entity';
import { User } from '../../users/entities/user.entity';
import { LessonPlanStatus } from '../enums/lesson-plan-status.enum';

@Entity('lesson_plans')
@Index(['tenantId'])
@Index(['scheduledDate'])
@Index(['status'])
export class LessonPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  lessonId: string;

  @ManyToOne(() => CurriculumLesson, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lessonId' })
  lesson: CurriculumLesson;

  @Column({ type: 'uuid', nullable: true })
  classroomId: string | null;

  @ManyToOne(() => Classroom, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'classroomId' })
  classroom: Classroom | null;

  @Column({ type: 'uuid', nullable: true })
  studentId: string | null;

  @ManyToOne(() => Student, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'studentId' })
  student: Student | null;

  @Column({ type: 'uuid' })
  teacherId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'teacherId' })
  teacher: User;

  @Column({ type: 'date' })
  scheduledDate: Date;

  @Column({
    type: 'enum',
    enum: LessonPlanStatus,
    default: LessonPlanStatus.PLANNED,
  })
  status: LessonPlanStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
