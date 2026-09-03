import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Student } from '../../students/entities/student.entity';
import { Badge } from './badge.entity';
import { User } from '../../users/entities/user.entity';

@Entity('student_badges')
@Index(['tenantId'])
@Index(['studentId'])
@Index(['badgeId'])
export class StudentBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column({ type: 'uuid' })
  badgeId: string;

  @ManyToOne(() => Badge, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'badgeId' })
  badge: Badge;

  @Column({ type: 'uuid' })
  awardedById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'awardedById' })
  awardedBy: User;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  awardedAt: Date;
}
