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
import { MontessoriArea } from '../../observations/enums/montessori-area.enum';

@Entity('curriculum_lessons')
@Index(['tenantId'])
@Index(['area'])
export class CurriculumLesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({
    type: 'enum',
    enum: MontessoriArea,
  })
  area: MontessoriArea;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ length: 50, default: '3–6 years' })
  ageGroup: string;

  @Column({ type: 'int', default: 1 })
  sequence: number;

  @Column({ type: 'text', nullable: true })
  materialsNeeded: string | null;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
