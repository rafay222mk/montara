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
import { Student } from '../../students/entities/student.entity';
import { FeeStructure } from './fee-structure.entity';
import { FeeStatus } from '../enums/fee-status.enum';

@Entity('student_fees')
export class StudentFee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Index()
  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ type: 'uuid' })
  feeStructureId: string;

  @ManyToOne(() => FeeStructure, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'feeStructureId' })
  feeStructure: FeeStructure;

  @Column('numeric', { precision: 10, scale: 2 })
  amount: number;

  @Index()
  @Column({ type: 'date' })
  dueDate: string; // YYYY-MM-DD format

  @Index()
  @Column({
    type: 'enum',
    enum: FeeStatus,
  })
  status: FeeStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
