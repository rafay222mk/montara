import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { Classroom } from '../../classrooms/entities/classroom.entity';

@Entity('students')
@Unique(['tenantId', 'admissionNumber'])
@Index(['tenantId'])
@Index(['isActive'])
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ type: 'date' })
  dateOfBirth: Date;

  @Column({ length: 20 })
  gender: string;

  @Column({ length: 50 })
  admissionNumber: string;

  @Column({ type: 'date' })
  enrollmentDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'uuid', nullable: true })
  parentId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: User;

  @Column({ type: 'uuid', nullable: true })
  classroomId: string;

  @ManyToOne(() => Classroom, (classroom) => classroom.students, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'classroomId' })
  classroom: Classroom;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
