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
import { MontessoriArea } from '../enums/montessori-area.enum';
import { ObservationProgress } from '../enums/observation-progress.enum';

@Entity('observations')
export class Observation {
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

  @Column({
    type: 'enum',
    enum: MontessoriArea,
  })
  area: MontessoriArea;

  @Column({ type: 'varchar', length: 255 })
  skill: string;

  @Column({ type: 'text' })
  notes: string;

  @Column({
    type: 'enum',
    enum: ObservationProgress,
  })
  progress: ObservationProgress;

  @Index()
  @Column({ type: 'date' })
  observedAt: string; // YYYY-MM-DD format

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
