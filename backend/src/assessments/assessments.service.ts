import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment } from './entities/assessment.entity';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { AssessmentQueryDto } from './dto/assessment-query.dto';
import { StudentsService } from '../students/students.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user-role.enum';
import { AssessmentLevel } from './enums/assessment-level.enum';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentRepository: Repository<Assessment>,
    private readonly studentsService: StudentsService,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateAssessmentDto, tenantId: string, teacherId: string): Promise<Assessment> {
    // 1. Resolve student and verify tenant isolation
    const student = await this.studentsService.findOne(dto.studentId, tenantId);

    // 2. Validate teacher exists and belongs to same tenant
    const teacher = await this.usersService.findOne(teacherId);
    if (!teacher || teacher.tenantId !== tenantId) {
      throw new ForbiddenException('Teacher must belong to the same tenant');
    }
    if (teacher.role !== UserRole.TEACHER && teacher.role !== UserRole.SCHOOL_ADMIN && teacher.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('User is not authorized to create assessments');
    }

    const assessment = this.assessmentRepository.create({
      ...dto,
      tenantId,
      teacherId,
    });

    const saved = await this.assessmentRepository.save(assessment);
    return this.findOne(saved.id, tenantId, teacher);
  }

  async findAll(tenantId: string, query: AssessmentQueryDto, currentUser: any): Promise<Assessment[]> {
    const qb = this.assessmentRepository.createQueryBuilder('assessment')
      .leftJoinAndSelect('assessment.student', 'student')
      .leftJoinAndSelect('assessment.teacher', 'teacher')
      .where('assessment.tenantId = :tenantId', { tenantId });

    // Enforce Parent Isolation
    if (currentUser.role === UserRole.PARENT) {
      qb.andWhere('student.parentId = :parentId', { parentId: currentUser.userId });
    }

    // Apply filters
    if (query.studentId) {
      qb.andWhere('assessment.studentId = :studentId', { studentId: query.studentId });
    }
    if (query.area) {
      qb.andWhere('assessment.area = :area', { area: query.area });
    }
    if (query.level) {
      qb.andWhere('assessment.level = :level', { level: query.level });
    }
    if (query.teacherId) {
      qb.andWhere('assessment.teacherId = :teacherId', { teacherId: query.teacherId });
    }
    if (query.assessedAt) {
      qb.andWhere('assessment.assessedAt = :assessedAt', { assessedAt: query.assessedAt });
    }
    if (query.fromDate) {
      qb.andWhere('assessment.assessedAt >= :fromDate', { fromDate: query.fromDate });
    }
    if (query.toDate) {
      qb.andWhere('assessment.assessedAt <= :toDate', { toDate: query.toDate });
    }

    return qb.getMany();
  }

  async findOne(id: string, tenantId: string, currentUser: any): Promise<Assessment> {
    const assessment = await this.assessmentRepository.findOne({
      where: { id },
      relations: ['student', 'teacher'],
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment record with ID ${id} not found`);
    }

    if (assessment.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied to this tenant resource');
    }

    if (currentUser.role === UserRole.PARENT && assessment.student.parentId !== currentUser.userId) {
      throw new ForbiddenException('Access denied to this student assessment');
    }

    return assessment;
  }

  async update(id: string, dto: UpdateAssessmentDto, tenantId: string, currentUser: any): Promise<Assessment> {
    const assessment = await this.findOne(id, tenantId, currentUser);

    if (dto.studentId && dto.studentId !== assessment.studentId) {
      // Validate new student exists and belongs to same tenant
      await this.studentsService.findOne(dto.studentId, tenantId);
    }

    this.assessmentRepository.merge(assessment, dto);
    const saved = await this.assessmentRepository.save(assessment);
    return this.findOne(saved.id, tenantId, currentUser);
  }

  async remove(id: string, tenantId: string, currentUser: any): Promise<void> {
    const assessment = await this.findOne(id, tenantId, currentUser);
    await this.assessmentRepository.remove(assessment);
  }

  async studentSummary(studentId: string, tenantId: string, currentUser: any): Promise<any> {
    const student = await this.studentsService.findOne(studentId, tenantId);
    if (currentUser.role === UserRole.PARENT && student.parentId !== currentUser.userId) {
      throw new ForbiddenException('Access denied to this student summary');
    }

    // 1. Total assessments count
    const totalAssessments = await this.assessmentRepository.count({
      where: { studentId },
    });

    // 2. Aggregate count per area
    const areaCounts = await this.assessmentRepository.createQueryBuilder('assess')
      .select('assess.area', 'area')
      .addSelect('COUNT(*)', 'count')
      .where('assess.studentId = :studentId', { studentId })
      .groupBy('assess.area')
      .getRawMany();

    // 3. Get latest progress per area (using DISTINCT ON PostgreSQL syntax for deterministic results)
    const latestAssessments = await this.assessmentRepository.manager.query(
      `SELECT DISTINCT ON (area) area, level, score, "assessedAt"
       FROM assessments
       WHERE "studentId" = $1
       ORDER BY area, "assessedAt" DESC, "createdAt" DESC, id DESC`,
      [studentId]
    );

    const areas = areaCounts.map((ac) => {
      const latest = latestAssessments.find((la: any) => la.area === ac.area);
      let latestAssessedAtString: string | null = null;
      if (latest && latest.assessedAt) {
        if (latest.assessedAt instanceof Date) {
          const dateObj = latest.assessedAt;
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          latestAssessedAtString = `${year}-${month}-${day}`;
        } else {
          latestAssessedAtString = String(latest.assessedAt);
        }
      }
      return {
        area: ac.area,
        assessmentCount: parseInt(ac.count, 10),
        latestLevel: latest ? latest.level : null,
        latestScore: latest && latest.score !== null ? parseInt(latest.score, 10) : null,
        latestAssessedAt: latestAssessedAtString,
      };
    });

    return {
      studentId: student.id,
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
      },
      totalAssessments,
      areas,
    };
  }

  async studentProgress(studentId: string, tenantId: string, currentUser: any): Promise<any> {
    const student = await this.studentsService.findOne(studentId, tenantId);
    if (currentUser.role === UserRole.PARENT && student.parentId !== currentUser.userId) {
      throw new ForbiddenException('Access denied to this student progress view');
    }

    const assessments = await this.assessmentRepository.find({
      where: { studentId },
    });

    if (assessments.length === 0) {
      return {
        studentId: student.id,
        totalAssessments: 0,
        overallAverageScore: null,
        areas: [],
        strongestArea: null,
        areasNeedingAttention: [],
      };
    }

    // 1. Calculate overall average score
    const scoredAssessments = assessments.filter((a) => a.score !== null);
    const overallAverageScore = scoredAssessments.length > 0
      ? parseFloat((scoredAssessments.reduce((sum, a) => sum + (a.score ?? 0), 0) / scoredAssessments.length).toFixed(1))
      : null;

    // 2. Group assessments by area in memory
    const grouped: Record<string, Assessment[]> = {};
    for (const a of assessments) {
      if (!grouped[a.area]) {
        grouped[a.area] = [];
      }
      grouped[a.area].push(a);
    }

    const areasList: any[] = [];
    for (const area of Object.keys(grouped)) {
      const areaAssessments = grouped[area];

      // Sort descending by date, created_at, id
      areaAssessments.sort((x, y) => {
        const dx = new Date(x.assessedAt).getTime();
        const dy = new Date(y.assessedAt).getTime();
        if (dx !== dy) return dy - dx;
        const cx = new Date(x.createdAt).getTime();
        const cy = new Date(y.createdAt).getTime();
        if (cx !== cy) return cy - cx;
        return y.id.localeCompare(x.id);
      });

      const latest = areaAssessments[0];
      const areaScored = areaAssessments.filter((a) => a.score !== null);
      const averageScore = areaScored.length > 0
        ? parseFloat((areaScored.reduce((sum, a) => sum + (a.score ?? 0), 0) / areaScored.length).toFixed(1))
        : null;

      areasList.push({
        area,
        averageScore,
        latestLevel: latest.level,
        latestScore: latest.score,
        latestAssessedAt: latest.assessedAt,
      });
    }

    // 3. Determine strongest area
    let strongestArea: string | null = null;
    const scoredAreas = areasList.filter((a) => a.averageScore !== null);
    if (scoredAreas.length > 0) {
      scoredAreas.sort((x, y) => (y.averageScore ?? 0) - (x.averageScore ?? 0));
      strongestArea = scoredAreas[0].area;
    } else if (areasList.length > 0) {
      const levelWeight = {
        [AssessmentLevel.BEGINNING]: 1,
        [AssessmentLevel.DEVELOPING]: 2,
        [AssessmentLevel.PROFICIENT]: 3,
        [AssessmentLevel.ADVANCED]: 4,
      };
      areasList.sort((x, y) => {
        const wx = levelWeight[x.latestLevel] ?? 0;
        const wy = levelWeight[y.latestLevel] ?? 0;
        return wy - wx;
      });
      strongestArea = areasList[0].area;
    }

    // 4. Determine areas needing attention
    const areasNeedingAttention = areasList
      .filter((a) => a.latestLevel === AssessmentLevel.BEGINNING || a.latestLevel === AssessmentLevel.DEVELOPING)
      .map((a) => a.area);

    return {
      studentId: student.id,
      totalAssessments: assessments.length,
      overallAverageScore,
      areas: areasList,
      strongestArea,
      areasNeedingAttention,
    };
  }
}
