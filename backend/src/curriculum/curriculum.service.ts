import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurriculumLesson } from './entities/curriculum-lesson.entity';
import { LessonPlan } from './entities/lesson-plan.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateLessonPlanDto } from './dto/create-lesson-plan.dto';
import { UpdateLessonPlanDto } from './dto/update-lesson-plan.dto';
import { MontessoriArea } from '../observations/enums/montessori-area.enum';
import { LessonPlanStatus } from './enums/lesson-plan-status.enum';

@Injectable()
export class CurriculumService {
  constructor(
    @InjectRepository(CurriculumLesson)
    private readonly lessonRepository: Repository<CurriculumLesson>,
    @InjectRepository(LessonPlan)
    private readonly planRepository: Repository<LessonPlan>,
  ) {}

  // ── Curriculum Lessons Catalog ──────────────────────────────
  async createLesson(tenantId: string, dto: CreateLessonDto): Promise<CurriculumLesson> {
    const lesson = this.lessonRepository.create({
      ...dto,
      tenantId,
    });
    return this.lessonRepository.save(lesson);
  }

  async findAllLessons(
    tenantId: string,
    filters?: { area?: MontessoriArea; ageGroup?: string; isActive?: boolean; search?: string },
  ): Promise<CurriculumLesson[]> {
    const query = this.lessonRepository.createQueryBuilder('lesson')
      .where('lesson.tenantId = :tenantId', { tenantId });

    if (filters?.area) {
      query.andWhere('lesson.area = :area', { area: filters.area });
    }

    if (filters?.ageGroup) {
      query.andWhere('lesson.ageGroup = :ageGroup', { ageGroup: filters.ageGroup });
    }

    if (filters?.isActive !== undefined) {
      query.andWhere('lesson.isActive = :isActive', { isActive: filters.isActive });
    }

    if (filters?.search) {
      query.andWhere(
        '(LOWER(lesson.title) LIKE :search OR LOWER(lesson.description) LIKE :search)',
        { search: `%${filters.search.toLowerCase()}%` },
      );
    }

    query.orderBy('lesson.area', 'ASC')
      .addOrderBy('lesson.sequence', 'ASC')
      .addOrderBy('lesson.title', 'ASC');

    return query.getMany();
  }

  async findOneLesson(id: string, tenantId: string): Promise<CurriculumLesson> {
    const lesson = await this.lessonRepository.findOne({
      where: { id, tenantId },
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }
    return lesson;
  }

  async updateLesson(id: string, tenantId: string, dto: UpdateLessonDto): Promise<CurriculumLesson> {
    const lesson = await this.findOneLesson(id, tenantId);
    Object.assign(lesson, dto);
    return this.lessonRepository.save(lesson);
  }

  async removeLesson(id: string, tenantId: string): Promise<{ success: boolean; message: string }> {
    const lesson = await this.findOneLesson(id, tenantId);
    await this.lessonRepository.remove(lesson);
    return { success: true, message: 'Lesson deleted successfully' };
  }

  // ── Lesson Planning / Scheduled Presentations ──────────────
  async createPlan(tenantId: string, teacherId: string, dto: CreateLessonPlanDto): Promise<LessonPlan> {
    const plan = this.planRepository.create({
      ...dto,
      scheduledDate: new Date(dto.scheduledDate),
      status: dto.status || LessonPlanStatus.PLANNED,
      teacherId,
      tenantId,
    });
    const saved = await this.planRepository.save(plan);
    return this.findOnePlan(saved.id, tenantId);
  }

  async findAllPlans(
    tenantId: string,
    filters?: {
      classroomId?: string;
      studentId?: string;
      teacherId?: string;
      status?: LessonPlanStatus;
      date?: string;
    },
  ): Promise<LessonPlan[]> {
    const query = this.planRepository.createQueryBuilder('plan')
      .leftJoinAndSelect('plan.lesson', 'lesson')
      .leftJoinAndSelect('plan.classroom', 'classroom')
      .leftJoinAndSelect('plan.student', 'student')
      .leftJoinAndSelect('plan.teacher', 'teacher')
      .where('plan.tenantId = :tenantId', { tenantId });

    if (filters?.classroomId) {
      query.andWhere('plan.classroomId = :classroomId', { classroomId: filters.classroomId });
    }

    if (filters?.studentId) {
      query.andWhere('plan.studentId = :studentId', { studentId: filters.studentId });
    }

    if (filters?.teacherId) {
      query.andWhere('plan.teacherId = :teacherId', { teacherId: filters.teacherId });
    }

    if (filters?.status) {
      query.andWhere('plan.status = :status', { status: filters.status });
    }

    if (filters?.date) {
      query.andWhere('plan.scheduledDate = :date', { date: filters.date });
    }

    query.orderBy('plan.scheduledDate', 'DESC')
      .addOrderBy('plan.createdAt', 'DESC');

    return query.getMany();
  }

  async findOnePlan(id: string, tenantId: string): Promise<LessonPlan> {
    const plan = await this.planRepository.findOne({
      where: { id, tenantId },
      relations: ['lesson', 'classroom', 'student', 'teacher'],
    });
    if (!plan) {
      throw new NotFoundException(`Lesson plan with ID ${id} not found`);
    }
    return plan;
  }

  async updatePlan(id: string, tenantId: string, dto: UpdateLessonPlanDto): Promise<LessonPlan> {
    const plan = await this.findOnePlan(id, tenantId);
    if (dto.scheduledDate) {
      plan.scheduledDate = new Date(dto.scheduledDate);
    }
    if (dto.status) plan.status = dto.status;
    if (dto.notes !== undefined) plan.notes = dto.notes;
    if (dto.lessonId) plan.lessonId = dto.lessonId;
    if (dto.classroomId !== undefined) plan.classroomId = dto.classroomId || null;
    if (dto.studentId !== undefined) plan.studentId = dto.studentId || null;

    await this.planRepository.save(plan);
    return this.findOnePlan(id, tenantId);
  }

  async removePlan(id: string, tenantId: string): Promise<{ success: boolean; message: string }> {
    const plan = await this.findOnePlan(id, tenantId);
    await this.planRepository.remove(plan);
    return { success: true, message: 'Lesson plan removed successfully' };
  }
}
