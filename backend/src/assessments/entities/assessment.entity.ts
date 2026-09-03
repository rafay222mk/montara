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
import { Student } from '../../students/entities/student.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { AssessmentArea } from '../enums/assessment-area.enum';
import { AssessmentLevel } from '../enums/assessment-level.enum';

@Entity('assessments')
@Index(['tenantId', 'assessedAt'])
@Index(['studentId', 'area'])
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Index()
  @Column({ type: 'uuid' })
  teacherId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'teacherId' })
  teacher: User;

  @Index()
  @Column({
    type: 'enum',
    enum: AssessmentArea,
  })
  area: AssessmentArea;

  @Column({ type: 'varchar', length: 255 })
  skill: string;

  @Column({
    type: 'enum',
    enum: AssessmentLevel,
  })
  level: AssessmentLevel;

  @Column({ type: 'integer', nullable: true })
  score: number | null;

  @Column({ type: 'text', nullable: true })
  comments: string | null;

  @Index()
  @Column({ type: 'date' })
  assessedAt: string; // YYYY-MM-DD format

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
