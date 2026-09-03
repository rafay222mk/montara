import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observation } from './entities/observation.entity';
import { CreateObservationDto } from './dto/create-observation.dto';
import { UpdateObservationDto } from './dto/update-observation.dto';
import { ObservationQueryDto } from './dto/observation-query.dto';
import { StudentsService } from '../students/students.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class ObservationsService {
  constructor(
    @InjectRepository(Observation)
    private readonly observationRepository: Repository<Observation>,
    private readonly studentsService: StudentsService,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateObservationDto, tenantId: string, teacherId: string): Promise<Observation> {
    // 1. Resolve student and verify tenant isolation
    const student = await this.studentsService.findOne(dto.studentId, tenantId);

    // 2. Validate teacher exists and belongs to same tenant
    const teacher = await this.usersService.findOne(teacherId);
    if (!teacher || teacher.tenantId !== tenantId) {
      throw new ForbiddenException('Teacher must belong to the same tenant');
    }
    if (teacher.role !== UserRole.TEACHER && teacher.role !== UserRole.SCHOOL_ADMIN && teacher.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('User is not authorized to create observations');
    }

    const observation = this.observationRepository.create({
      ...dto,
      tenantId,
      teacherId,
    });

    const saved = await this.observationRepository.save(observation);
    
    // Return observation with relationships populated
    return this.findOne(saved.id, tenantId, teacher);
  }

  async findAll(tenantId: string, query: ObservationQueryDto, currentUser: any): Promise<Observation[]> {
    const qb = this.observationRepository.createQueryBuilder('observation')
      .leftJoinAndSelect('observation.student', 'student')
      .leftJoinAndSelect('observation.teacher', 'teacher')
      .where('observation.tenantId = :tenantId', { tenantId });

    // Enforce Parent Isolation
    if (currentUser.role === UserRole.PARENT) {
      qb.andWhere('student.parentId = :parentId', { parentId: currentUser.userId });
    }

    // Apply filters
    if (query.studentId) {
      qb.andWhere('observation.studentId = :studentId', { studentId: query.studentId });
    }
    if (query.area) {
      qb.andWhere('observation.area = :area', { area: query.area });
    }
    if (query.progress) {
      qb.andWhere('observation.progress = :progress', { progress: query.progress });
    }
    if (query.observedAt) {
      qb.andWhere('observation.observedAt = :observedAt', { observedAt: query.observedAt });
    }
    if (query.fromDate) {
      qb.andWhere('observation.observedAt >= :fromDate', { fromDate: query.fromDate });
    }
    if (query.toDate) {
      qb.andWhere('observation.observedAt <= :toDate', { toDate: query.toDate });
    }
    if (query.teacherId) {
      qb.andWhere('observation.teacherId = :teacherId', { teacherId: query.teacherId });
    }

    return qb.getMany();
  }

  async findOne(id: string, tenantId: string, currentUser: any): Promise<Observation> {
    const observation = await this.observationRepository.findOne({
      where: { id },
      relations: ['student', 'teacher'],
    });

    if (!observation) {
      throw new NotFoundException(`Observation record with ID ${id} not found`);
    }

    if (observation.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied to this tenant resource');
    }

    if (currentUser.role === UserRole.PARENT && observation.student.parentId !== currentUser.userId) {
      throw new ForbiddenException('Access denied to this student observation');
    }

    return observation;
  }

  async update(id: string, dto: UpdateObservationDto, tenantId: string, currentUser: any): Promise<Observation> {
    const observation = await this.findOne(id, tenantId, currentUser);

    if (dto.studentId && dto.studentId !== observation.studentId) {
      // Validate new student exists and belongs to same tenant
      await this.studentsService.findOne(dto.studentId, tenantId);
    }

    this.observationRepository.merge(observation, dto);
    const saved = await this.observationRepository.save(observation);
    return this.findOne(saved.id, tenantId, currentUser);
  }

  async remove(id: string, tenantId: string, currentUser: any): Promise<void> {
    const observation = await this.findOne(id, tenantId, currentUser);
    await this.observationRepository.remove(observation);
  }

  async studentSummary(studentId: string, tenantId: string, currentUser: any): Promise<any> {
    const student = await this.studentsService.findOne(studentId, tenantId);
    if (currentUser.role === UserRole.PARENT && student.parentId !== currentUser.userId) {
      throw new ForbiddenException('Access denied to this student summary');
    }

    // 1. Total observations count
    const totalObservations = await this.observationRepository.count({
      where: { studentId },
    });

    // 2. Aggregate count per area
    const areaCounts = await this.observationRepository.createQueryBuilder('obs')
      .select('obs.area', 'area')
      .addSelect('COUNT(*)', 'count')
      .where('obs.studentId = :studentId', { studentId })
      .groupBy('obs.area')
      .getRawMany();

    // 3. Get latest progress per area (using DISTINCT ON PostgreSQL syntax)
    const latestObservations = await this.observationRepository.manager.query(
      `SELECT DISTINCT ON (area) area, progress, "observedAt"
       FROM observations
       WHERE "studentId" = $1
       ORDER BY area, "observedAt" DESC, "createdAt" DESC`,
      [studentId]
    );

    const areas = areaCounts.map((ac) => {
      const latest = latestObservations.find((lo: any) => lo.area === ac.area);
      let latestObservedAtString: string | null = null;
      if (latest && latest.observedAt) {
        if (latest.observedAt instanceof Date) {
          const dateObj = latest.observedAt;
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          latestObservedAtString = `${year}-${month}-${day}`;
        } else {
          latestObservedAtString = String(latest.observedAt);
        }
      }
      return {
        area: ac.area,
        observationCount: parseInt(ac.count, 10),
        latestProgress: latest ? latest.progress : null,
        latestObservedAt: latestObservedAtString,
      };
    });

    return {
      studentId: student.id,
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      totalObservations,
      areas,
    };
  }
}
