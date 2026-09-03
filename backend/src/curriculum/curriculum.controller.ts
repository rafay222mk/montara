import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateLessonPlanDto } from './dto/create-lesson-plan.dto';
import { UpdateLessonPlanDto } from './dto/update-lesson-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { MontessoriArea } from '../observations/enums/montessori-area.enum';
import { LessonPlanStatus } from './enums/lesson-plan-status.enum';

@Controller('curriculum')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  // ── Curriculum Lessons Catalog ──────────────────────────────
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  createLesson(@CurrentUser() user: any, @Body() dto: CreateLessonDto) {
    return this.curriculumService.createLesson(user.tenantId, dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  findAllLessons(
    @CurrentUser() user: any,
    @Query('area') area?: MontessoriArea,
    @Query('ageGroup') ageGroup?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.curriculumService.findAllLessons(user.tenantId, {
      area,
      ageGroup,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
    });
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  findOneLesson(@CurrentUser() user: any, @Param('id') id: string) {
    return this.curriculumService.findOneLesson(id, user.tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  updateLesson(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.curriculumService.updateLesson(id, user.tenantId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  removeLesson(@CurrentUser() user: any, @Param('id') id: string) {
    return this.curriculumService.removeLesson(id, user.tenantId);
  }

  // ── Lesson Plans / Scheduled Presentations ──────────────────
  @Post('plans/schedule')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  createPlan(@CurrentUser() user: any, @Body() dto: CreateLessonPlanDto) {
    return this.curriculumService.createPlan(user.tenantId, user.userId, dto);
  }

  @Get('plans/list')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  findAllPlans(
    @CurrentUser() user: any,
    @Query('classroomId') classroomId?: string,
    @Query('studentId') studentId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: LessonPlanStatus,
    @Query('date') date?: string,
  ) {
    return this.curriculumService.findAllPlans(user.tenantId, {
      classroomId,
      studentId,
      teacherId,
      status,
      date,
    });
  }

  @Get('plans/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT)
  findOnePlan(@CurrentUser() user: any, @Param('id') id: string) {
    return this.curriculumService.findOnePlan(id, user.tenantId);
  }

  @Patch('plans/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  updatePlan(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateLessonPlanDto,
  ) {
    return this.curriculumService.updatePlan(id, user.tenantId, dto);
  }

  @Delete('plans/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  removePlan(@CurrentUser() user: any, @Param('id') id: string) {
    return this.curriculumService.removePlan(id, user.tenantId);
  }
}
